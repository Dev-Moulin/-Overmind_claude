// 🌟 BloomMachine - Atome B1
// Machine XState pour gestion bloom complète

import { createMachine, assign } from 'xstate';
import type {
  BloomContext,
  SecurityPreset,
  BloomGroupType
} from './types';

export const bloomMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOmwAQIARSgZQCUB9AeQHkBlABQEkBBAMQDyAYQCSAYgBEAkgBUAwgEEA4gFkA2gAYAuolAAOUsliwHKOkAA9EAJgDsAZgCsADhoaGe3QwYeADgwA9m4BaACsJiYanl6WcREB8u5WKnLoWLgExGRUNPSMzGwcPAKCIuKSMvKKKupWBk7uIY5R5iHhFhqxRnGWGo7hJjHx7q3xGjFGk-EaTnOO5p4zCYjRsW52GrHe5hpGk+2xHXZOGKt2PXaD1cN1I6KiEtJyCkoQqhrJqWkZWTlckVCp5PIEJtFZg4lgxtAAPbQzBhGS6GSzrKzrJwrM4MHprZZJVbJdYeLYHXZHU7nS7lEBheSPGLPCAADzCUH8jgIGmhJmio0mi3maJAG08azWHlxB3xxP2FM2VNp9K8NjZexOZx5F35l0FPmFQpebg0hmcXgYzjWBhMzl+mNlGJN6usHms-n8gTAQA */
  id: 'bloom',

  // TypeScript schema pour XState v5 compatibility

  context: {
    global: {
      threshold: 0.15,
      strength: 0.40,
      radius: 0.40,
      enabled: false,
      exposure: 1.0
    },

    groups: {
      iris: {
        threshold: 0.3,
        strength: 0.8,
        radius: 0.4,
        objects: new Map(),
        emissiveColor: 0x00ff88,
        emissiveIntensity: 0.3
      },

      eyeRings: {
        threshold: 0.4,
        strength: 0.6,
        radius: 0.3,
        objects: new Map(),
        emissiveColor: 0x4488ff,
        emissiveIntensity: 0.4
      },

      revealRings: {
        threshold: 0.43,
        strength: 0.40,
        radius: 0.36,
        objects: new Map(),
        emissiveColor: 0xffaa00,
        emissiveIntensity: 0.5
      },

      magicRings: {
        threshold: 0.3,
        strength: 0.6,
        radius: 0.3,
        objects: new Map(),
        emissiveColor: 0x4488ff,
        emissiveIntensity: 0.4
      },

      arms: {
        threshold: 0.5,
        strength: 0.4,
        radius: 0.2,
        objects: new Map(),
        emissiveColor: 0x6666ff,
        emissiveIntensity: 0.1
      }
    },

    security: {
      currentPreset: null,
      presets: {
        SAFE: { color: 0x00ff88, intensity: 0.3 },
        DANGER: { color: 0xff4444, intensity: 0.8 },
        WARNING: { color: 0xffaa00, intensity: 0.5 },
        SCANNING: { color: 0x4488ff, intensity: 0.6 },
        NORMAL: { color: 0xffffff, intensity: 0.2 }
      },
      isTransitioning: false
    },

    simpleBloomSystem: null,
    bloomControlCenter: null,
    frameScheduler: null,

    performance: {
      updateCount: 0,
      lastUpdateTime: 0,
      averageUpdateTime: 0
    }
  } satisfies BloomContext,

  type: 'parallel',

  states: {
    // 🌟 ÉTAT 1: Gestion Bloom Global
    global: {
      initial: 'disabled',

      states: {
        disabled: {
          on: {
            ENABLE_BLOOM: 'enabling',
            UPDATE_GLOBAL: {
              actions: 'updateGlobalParams'
            }
          }
        },

        enabling: {
          invoke: {
            id: 'enableGlobalBloom',
            src: 'enableGlobalBloom',
            onDone: {
              target: 'enabled',
              actions: assign({
                global: (context: BloomContext) => ({
                  ...context.global,
                  enabled: true
                })
              })
            },
            onError: 'error'
          }
        },

        enabled: {
          on: {
            DISABLE_BLOOM: 'disabling',
            UPDATE_GLOBAL: {
              actions: [
                'updateGlobalParams',
                'syncGlobalWithRenderer'
              ]
            }
          }
        },

        disabling: {
          invoke: {
            id: 'disableGlobalBloom',
            src: 'disableGlobalBloom',
            onDone: {
              target: 'disabled',
              actions: assign({
                global: (context: BloomContext) => ({
                  ...context.global,
                  enabled: false
                })
              })
            }
          }
        },

        error: {
          on: {
            RETRY: 'enabling',
            RESET: 'disabled'
          }
        }
      }
    },

    // 🎭 ÉTAT 2: Gestion Groupes (États Parallèles)
    groups: {
      type: 'parallel',

      states: {
        iris: {
          initial: 'idle',

          states: {
            idle: {
              on: {
                UPDATE_GROUP_IRIS: {
                  target: 'updating',
                  actions: 'updateGroupIris'
                },
                REGISTER_OBJECTS: [
                  {
                    cond: (_, event) => event.group === 'iris',
                    actions: 'registerIrisObjects'
                  }
                ]
              }
            },

            updating: {
              invoke: {
                id: 'updateGroupBloom',
                src: 'updateGroupBloom',
                data: { group: 'iris' },
                onDone: 'idle',
                onError: 'idle'
              }
            }
          }
        },

        eyeRings: {
          initial: 'idle',

          states: {
            idle: {
              on: {
                UPDATE_GROUP_EYERINGS: {
                  target: 'updating',
                  actions: 'updateGroupEyeRings'
                },
                REGISTER_OBJECTS: [
                  {
                    cond: (_, event) => event.group === 'eyeRings',
                    actions: 'registerEyeRingsObjects'
                  }
                ]
              }
            },

            updating: {
              invoke: {
                id: 'updateGroupBloom',
                src: 'updateGroupBloom',
                data: { group: 'eyeRings' },
                onDone: 'idle',
                onError: 'idle'
              }
            }
          }
        },

        revealRings: {
          initial: 'idle',

          states: {
            idle: {
              on: {
                UPDATE_GROUP_REVEALRINGS: {
                  target: 'updating',
                  actions: 'updateGroupRevealRings'
                },
                REGISTER_OBJECTS: [
                  {
                    cond: (_, event) => event.group === 'revealRings',
                    actions: 'registerRevealRingsObjects'
                  }
                ]
              }
            },

            updating: {
              invoke: {
                id: 'updateGroupBloom',
                src: 'updateGroupBloom',
                data: { group: 'revealRings' },
                onDone: 'idle',
                onError: 'idle'
              }
            }
          }
        },

        magicRings: {
          initial: 'idle',

          states: {
            idle: {
              on: {
                UPDATE_GROUP_MAGICRINGS: {
                  target: 'updating',
                  actions: 'updateGroupMagicRings'
                },
                REGISTER_OBJECTS: [
                  {
                    cond: (_, event) => event.group === 'magicRings',
                    actions: 'registerMagicRingsObjects'
                  }
                ]
              }
            },

            updating: {
              invoke: {
                id: 'updateGroupBloom',
                src: 'updateGroupBloom',
                data: { group: 'magicRings' },
                onDone: 'idle',
                onError: 'idle'
              }
            }
          }
        },

        arms: {
          initial: 'idle',

          states: {
            idle: {
              on: {
                UPDATE_GROUP_ARMS: {
                  target: 'updating',
                  actions: 'updateGroupArms'
                },
                REGISTER_OBJECTS: [
                  {
                    cond: (_, event) => event.group === 'arms',
                    actions: 'registerArmsObjects'
                  }
                ]
              }
            },

            updating: {
              invoke: {
                id: 'updateGroupBloom',
                src: 'updateGroupBloom',
                data: { group: 'arms' },
                onDone: 'idle',
                onError: 'idle'
              }
            }
          }
        }
      },

      // Events communs à tous les groupes
      on: {
        DETECT_OBJECTS: {
          actions: 'detectAndRegisterObjects'
        },
        SYNC_WITH_FRAMESCHEDULER: {
          actions: 'syncWithFrameScheduler'
        }
      }
    },

    // 🔒 ÉTAT 3: Gestion Sécurité
    security: {
      initial: 'normal',

      states: {
        normal: {
          on: {
            SET_SECURITY: {
              target: 'transitioning',
              cond: 'isValidSecurityPreset',
              actions: assign({
                security: (context: BloomContext) => ({
                  ...context.security,
                  isTransitioning: true
                })
              })
            }
          }
        },

        transitioning: {
          invoke: {
            id: 'applySecurityPreset',
            src: 'applySecurityPreset',
            onDone: {
              target: 'normal',
              actions: [
                assign({
                  security: (context: BloomContext, event: any) => ({
                    ...context.security,
                    currentPreset: event.data.preset,
                    isTransitioning: false
                  })
                }),
                'notifySecurityTransition'
              ]
            },
            onError: {
              target: 'normal',
              actions: assign({
                security: (context: BloomContext) => ({
                  ...context.security,
                  isTransitioning: false
                })
              })
            }
          }
        }
      }
    }
  },

  // Events globaux (tous états)
  on: {
    SYNC_WITH_RENDERER: {
      actions: 'syncWithRenderer'
    },
    FORCE_REFRESH: {
      actions: 'forceRefresh'
    },
    DISPOSE: {
      actions: 'dispose'
    },
    ERROR: {
      actions: 'logError'
    }
  }
});

export default bloomMachine;