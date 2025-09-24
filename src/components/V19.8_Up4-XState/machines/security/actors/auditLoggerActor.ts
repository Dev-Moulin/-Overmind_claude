/**
 * 📊 AUDIT LOGGER ACTOR - Ring Buffer + Export (Claude IA)
 * Actor isolé pour audit logging avec ring buffer optimisé
 */

import { createMachine, assign } from 'xstate';
import type { AuditEntry, AuditFilters, AuditEventType, SecurityLevel } from '../securityTypes';
import * as securityGuards from '../guards';

// ================================
// AUDIT RING BUFFER
// ================================
class AuditRingBuffer {
  private buffer = new ArrayBuffer(1048576); // 1MB
  private view = new DataView(this.buffer);
  private position = 0;
  private entriesCount = 0;
  private readonly maxEntries = 10000;

  write(entry: AuditEntry) {
    const compressed = this.compressLZ(JSON.stringify(entry));

    // Header: size (4) + timestamp (4) + type (1)
    const headerSize = 9;
    const totalSize = headerSize + compressed.length;

    // Check if we need to wrap around
    if (this.position + totalSize > this.buffer.byteLength) {
      this.position = 0; // Wrap around
    }

    // Header
    this.view.setUint32(this.position, compressed.length);
    this.view.setUint32(this.position + 4, entry.timestamp);
    this.view.setUint8(this.position + 8, this.getEventTypeId(entry.type));

    // Compressed data
    for (let i = 0; i < compressed.length; i++) {
      this.view.setUint8(this.position + headerSize + i, compressed[i]);
    }

    this.position = (this.position + totalSize) % this.buffer.byteLength;
    this.entriesCount = Math.min(this.entriesCount + 1, this.maxEntries);
  }

  read(count: number = 100): AuditEntry[] {
    const entries: AuditEntry[] = [];
    let readPosition = Math.max(0, this.position - (count * 200)); // Approximation

    for (let i = 0; i < Math.min(count, this.entriesCount); i++) {
      try {
        const size = this.view.getUint32(readPosition);
        const timestamp = this.view.getUint32(readPosition + 4);
        const typeId = this.view.getUint8(readPosition + 8);

        const compressed = new Uint8Array(size);
        for (let j = 0; j < size; j++) {
          compressed[j] = this.view.getUint8(readPosition + 9 + j);
        }

        const decompressed = this.decompressLZ(compressed);
        const entry = JSON.parse(decompressed) as AuditEntry;
        entries.push(entry);

        readPosition = (readPosition + 9 + size) % this.buffer.byteLength;
      } catch (error) {
        break; // Corrupted data or end of valid entries
      }
    }

    return entries.reverse(); // Most recent first
  }

  exportToIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.position < 524288) { // Less than 512KB
        resolve();
        return;
      }

      const entries = this.read(this.entriesCount);
      this.flushToIndexedDB(entries).then(resolve).catch(reject);
    });
  }

  private compressLZ(data: string): Uint8Array {
    // Simplified LZ compression
    const bytes = new TextEncoder().encode(data);
    const compressed: number[] = [];
    let i = 0;

    while (i < bytes.length) {
      let bestLength = 0;
      let bestDistance = 0;

      // Look for matches in the last 255 bytes
      for (let distance = 1; distance <= Math.min(255, i); distance++) {
        let length = 0;
        while (
          length < 255 &&
          i + length < bytes.length &&
          bytes[i + length] === bytes[i + length - distance]
        ) {
          length++;
        }

        if (length > bestLength) {
          bestLength = length;
          bestDistance = distance;
        }
      }

      if (bestLength >= 3) {
        // Encode as distance/length pair
        compressed.push(0); // Marker for compressed sequence
        compressed.push(bestDistance);
        compressed.push(bestLength);
        i += bestLength;
      } else {
        // Encode literal byte
        compressed.push(bytes[i]);
        i++;
      }
    }

    return new Uint8Array(compressed);
  }

  private decompressLZ(compressed: Uint8Array): string {
    const decompressed: number[] = [];
    let i = 0;

    while (i < compressed.length) {
      if (compressed[i] === 0 && i + 2 < compressed.length) {
        // Compressed sequence
        const distance = compressed[i + 1];
        const length = compressed[i + 2];

        for (let j = 0; j < length; j++) {
          const sourceIndex = decompressed.length - distance;
          decompressed.push(decompressed[sourceIndex + j]);
        }

        i += 3;
      } else {
        // Literal byte
        decompressed.push(compressed[i]);
        i++;
      }
    }

    return new TextDecoder().decode(new Uint8Array(decompressed));
  }

  private getEventTypeId(type: AuditEventType): number {
    const types: AuditEventType[] = [
      'security_level_change',
      'threat_detected',
      'alert_triggered',
      'performance_degradation',
      'system_recovery',
      'manual_override'
    ];
    return types.indexOf(type);
  }

  private async flushToIndexedDB(entries: AuditEntry[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SecurityAudit', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('auditLogs')) {
          const store = db.createObjectStore('auditLogs', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
          store.createIndex('level', 'level');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['auditLogs'], 'readwrite');
        const store = transaction.objectStore('auditLogs');

        const batch = entries.slice(0, 1000); // Process in batches
        batch.forEach(entry => store.put(entry));

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };

        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  getStats() {
    return {
      bufferSize: this.buffer.byteLength,
      position: this.position,
      entriesCount: this.entriesCount,
      utilizationPercent: (this.position / this.buffer.byteLength) * 100
    };
  }
}

// ================================
// AUDIT EXPORT MANAGER
// ================================
class AuditExportManager {
  static async exportToJSON(entries: AuditEntry[], filters?: AuditFilters): Promise<string> {
    const filtered = this.applyFilters(entries, filters);
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalEntries: filtered.length,
        filters: filters || {},
        version: '1.0'
      },
      entries: filtered
    };

    return JSON.stringify(exportData, null, 2);
  }

  static async exportToCSV(entries: AuditEntry[], filters?: AuditFilters): Promise<string> {
    const filtered = this.applyFilters(entries, filters);

    const headers = ['id', 'timestamp', 'type', 'level', 'source', 'data', 'userId'];
    const csvRows = [headers.join(',')];

    filtered.forEach(entry => {
      const row = [
        entry.id,
        new Date(entry.timestamp).toISOString(),
        entry.type,
        entry.level,
        entry.source,
        JSON.stringify(entry.data).replace(/"/g, '""'), // Escape quotes
        entry.userId || ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private static applyFilters(entries: AuditEntry[], filters?: AuditFilters): AuditEntry[] {
    if (!filters) return entries;

    return entries.filter(entry => {
      if (filters.startTime && entry.timestamp < filters.startTime) return false;
      if (filters.endTime && entry.timestamp > filters.endTime) return false;
      if (filters.levels && !filters.levels.includes(entry.level)) return false;
      if (filters.types && !filters.types.includes(entry.type)) return false;
      if (filters.source && entry.source !== filters.source) return false;
      return true;
    });
  }
}

// ================================
// AUDIT LOGGER ACTOR CONTEXT
// ================================
interface AuditLoggerContext {
  ringBuffer: AuditRingBuffer;
  isLogging: boolean;
  autoArchive: boolean;
  archiveThreshold: number; // MB
  maxRetentionDays: number;
  compressionEnabled: boolean;
  exportInProgress: boolean;
}

type AuditLoggerEvent =
  | { type: 'START_LOGGING' }
  | { type: 'STOP_LOGGING' }
  | { type: 'LOG_ENTRY'; entry: Omit<AuditEntry, 'id' | 'timestamp'> }
  | { type: 'EXPORT_REQUEST'; format: 'json' | 'csv'; filters?: AuditFilters }
  | { type: 'ARCHIVE_REQUEST' }
  | { type: 'CLEANUP_REQUEST' }
  | { type: 'GET_STATS' };

// ================================
// AUDIT LOGGER ACTOR MACHINE
// ================================
export const auditLoggerActor = createMachine(
  {
    id: 'audit-logger-actor',

    context: {
      ringBuffer: new AuditRingBuffer(),
      isLogging: false,
      autoArchive: true,
      archiveThreshold: 512, // 512MB
      maxRetentionDays: 30,
      compressionEnabled: true,
      exportInProgress: false
    },

    initial: 'inactive',

    states: {
      inactive: {
        on: {
          START_LOGGING: 'logging'
        }
      },

      logging: {
        entry: assign({ isLogging: () => true }),
        exit: assign({ isLogging: () => false }),

        invoke: {
          src: 'autoArchiveService',
          onDone: {
            actions: 'handleArchiveComplete'
          }
        },

        on: {
          STOP_LOGGING: 'inactive',

          LOG_ENTRY: {
            actions: 'writeToBuffer'
          },

          EXPORT_REQUEST: {
            target: 'exporting',
            cond: 'canExportAudit'
          },

          ARCHIVE_REQUEST: {
            actions: 'performArchive'
          },

          CLEANUP_REQUEST: {
            actions: 'performCleanup'
          },

          GET_STATS: {
            actions: 'returnStats'
          }
        }
      },

      exporting: {
        entry: assign({ exportInProgress: () => true }),
        exit: assign({ exportInProgress: () => false }),

        invoke: {
          src: 'exportService',
          onDone: {
            target: 'logging',
            actions: 'handleExportComplete'
          },
          onError: {
            target: 'logging',
            actions: 'handleExportError'
          }
        },

        on: {
          STOP_LOGGING: 'inactive'
        }
      }
    }
  },
  {

    services: {
      autoArchiveService: (context) => (callback) => {
        const interval = setInterval(() => {
          const stats = context.ringBuffer.getStats();
          if (stats.utilizationPercent > 80 && context.autoArchive) {
            callback({ type: 'ARCHIVE_NEEDED' });
          }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
      },

      exportService: (context, event: AuditLoggerEvent & { type: 'EXPORT_REQUEST' }) =>
        async () => {
          const entries = context.ringBuffer.read(10000);

          if (event.format === 'json') {
            const json = await AuditExportManager.exportToJSON(entries, event.filters);
            return { format: 'json', data: json, entries: entries.length };
          } else {
            const csv = await AuditExportManager.exportToCSV(entries, event.filters);
            return { format: 'csv', data: csv, entries: entries.length };
          }
        }
    },

    actions: {
      writeToBuffer: (context, event: AuditLoggerEvent & { type: 'LOG_ENTRY' }) => {
        const entry: AuditEntry = {
          ...event.entry,
          id: crypto.randomUUID(),
          timestamp: Date.now()
        };

        context.ringBuffer.write(entry);
      },

      performArchive: (context) => {
        context.ringBuffer.exportToIndexedDB().catch(console.error);
      },

      performCleanup: (context) => {
        // Cleanup old IndexedDB entries
        const cutoffDate = Date.now() - (context.maxRetentionDays * 24 * 60 * 60 * 1000);

        // This would be implemented to clean up IndexedDB
        console.log('Performing cleanup for entries older than', new Date(cutoffDate));
      },

      returnStats: (context) => {
        const stats = context.ringBuffer.getStats();
        console.log('Audit Stats:', stats);
      },

      handleArchiveComplete: () => {
        console.log('Archive completed successfully');
      },

      handleExportComplete: (_, event: any) => {
        console.log('Export completed:', event.data);

        // Download the file
        const blob = new Blob([event.data.data], {
          type: event.data.format === 'json' ? 'application/json' : 'text/csv'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-audit-${Date.now()}.${event.data.format}`;
        a.click();
        URL.revokeObjectURL(url);
      },

      handleExportError: (_, event: any) => {
        console.error('Export failed:', event.data);
      }
    },

    // ============================================
    // GUARDS
    // ============================================
    guards: {
      canExportAudit: (context: AuditLoggerContext) => {
        return !context.exportInProgress; // Simplifié - assume qu'il y a toujours des données
      }
    }
  }
);