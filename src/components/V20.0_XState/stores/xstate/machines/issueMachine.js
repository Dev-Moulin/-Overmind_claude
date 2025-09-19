import { createMachine, assign, spawn } from 'xstate';

/**
 * 🎯 ISSUE TRACKING STATE MACHINE V1.0
 * Gestion complète du cycle de vie des issues GitHub
 * Basé sur l'architecture sceneMachine.js
 */

const ISSUE_CONFIG = {
  priorities: ['critical', 'high', 'medium', 'low'],

  statuses: {
    backlog: { label: 'Backlog', color: '#6b7280' },
    todo: { label: 'To Do', color: '#3b82f6' },
    inProgress: { label: 'In Progress', color: '#f59e0b' },
    review: { label: 'In Review', color: '#8b5cf6' },
    testing: { label: 'Testing', color: '#10b981' },
    done: { label: 'Done', color: '#22c55e' },
    blocked: { label: 'Blocked', color: '#ef4444' }
  },

  labels: {
    bug: { color: '#d73a4a', description: 'Something isn\'t working' },
    enhancement: { color: '#a2eeef', description: 'New feature or request' },
    documentation: { color: '#0075ca', description: 'Improvements or additions to documentation' },
    xstate: { color: '#7057ff', description: 'Related to XState implementation' },
    critical: { color: '#e11d48', description: 'Critical priority' },
    synchronization: { color: '#fbca04', description: 'Sync issues' }
  },

  milestones: {
    coreInfrastructure: { weeks: '1-2', focus: 'Synchronization, Checkpoints' },
    intelligenceDetection: { weeks: '3-4', focus: 'Impact Analysis, Problem Detection' },
    uiPolish: { weeks: '5-6', focus: 'UI, Tests, Documentation' }
  }
};

/**
 * ISSUE STATE MACHINE - Gestion du cycle de vie
 */
export const issueMachine = createMachine({
  id: 'issueTracking',
  initial: 'initializing',

  context: {
    issues: [],

    activeIssue: null,

    workflow: {
      checkpoints: [],
      dependencies: [],
      blockers: []
    },

    analytics: {
      totalIssues: 0,
      completedIssues: 0,
      blockedIssues: 0,
      averageTime: 0
    },

    config: { ...ISSUE_CONFIG },

    metadata: {
      version: '1.0.0',
      lastSync: null,
      repository: null
    }
  },

  states: {
    initializing: {
      entry: 'initializeSystem',
      on: {
        SYSTEM_READY: {
          target: 'dashboard',
          actions: 'setRepositoryInfo'
        }
      }
    },

    dashboard: {
      initial: 'overview',

      states: {
        overview: {
          entry: 'updateAnalytics',
          on: {
            VIEW_ISSUE: {
              target: 'issueDetails',
              actions: 'selectIssue'
            },
            CREATE_ISSUE: 'creatingIssue',
            FILTER_ISSUES: {
              actions: 'applyFilters'
            }
          }
        },

        issueDetails: {
          initial: 'viewing',

          states: {
            viewing: {
              on: {
                EDIT_ISSUE: 'editing',
                START_WORK: {
                  actions: 'transitionToInProgress'
                },
                CLOSE_DETAILS: {
                  target: '#issueTracking.dashboard.overview'
                }
              }
            },

            editing: {
              on: {
                SAVE_CHANGES: {
                  target: 'viewing',
                  actions: 'saveIssueChanges'
                },
                CANCEL_EDIT: 'viewing'
              }
            }
          }
        },

        creatingIssue: {
          on: {
            SUBMIT_ISSUE: {
              target: 'overview',
              actions: 'createNewIssue'
            },
            CANCEL_CREATE: 'overview'
          }
        }
      }
    },

    workflow: {
      type: 'parallel',

      states: {
        issueLifecycle: {
          initial: 'backlog',

          states: {
            backlog: {
              on: {
                MOVE_TO_TODO: 'todo',
                ARCHIVE: 'archived'
              }
            },

            todo: {
              entry: 'addToSprintPlan',
              on: {
                START_WORK: 'inProgress',
                MOVE_TO_BACKLOG: 'backlog'
              }
            },

            inProgress: {
              entry: ['startTimer', 'notifyAssignee'],

              on: {
                SUBMIT_FOR_REVIEW: 'review',
                BLOCK_ISSUE: 'blocked',
                MOVE_TO_TODO: 'todo'
              },

              after: {
                86400000: {
                  actions: 'sendProgressReminder'
                }
              }
            },

            review: {
              entry: 'requestReview',

              on: {
                APPROVE: 'testing',
                REQUEST_CHANGES: 'inProgress',
                REJECT: 'todo'
              }
            },

            testing: {
              entry: 'runTestSuite',

              on: {
                TESTS_PASS: 'done',
                TESTS_FAIL: 'inProgress',
                MANUAL_OVERRIDE: 'done'
              }
            },

            done: {
              type: 'final',
              entry: ['stopTimer', 'updateMetrics', 'closeIssue']
            },

            blocked: {
              entry: 'identifyBlockers',

              on: {
                UNBLOCK: {
                  target: 'inProgress',
                  cond: 'canUnblock'
                },
                ESCALATE: {
                  actions: 'escalateToHighPriority'
                }
              }
            },

            archived: {
              type: 'final'
            }
          }
        },

        dependencyTracker: {
          initial: 'monitoring',

          states: {
            monitoring: {
              on: {
                DEPENDENCY_ADDED: {
                  actions: 'addDependency'
                },
                DEPENDENCY_RESOLVED: {
                  actions: 'resolveDependency'
                },
                CHECK_DEPENDENCIES: {
                  actions: 'validateDependencies'
                }
              }
            }
          }
        },

        automationEngine: {
          initial: 'idle',

          states: {
            idle: {
              on: {
                TRIGGER_AUTOMATION: 'processing'
              }
            },

            processing: {
              invoke: {
                src: 'processAutomation',
                onDone: {
                  target: 'idle',
                  actions: 'applyAutomationResults'
                },
                onError: {
                  target: 'idle',
                  actions: 'logAutomationError'
                }
              }
            }
          }
        }
      }
    },

    planning: {
      initial: 'analyzingScope',

      states: {
        analyzingScope: {
          invoke: {
            src: 'analyzeProjectScope',
            onDone: {
              target: 'generatingPlan',
              actions: 'setScopeAnalysis'
            }
          }
        },

        generatingPlan: {
          invoke: {
            src: 'generateActionPlan',
            onDone: {
              target: 'reviewingPlan',
              actions: 'setPlan'
            }
          }
        },

        reviewingPlan: {
          on: {
            APPROVE_PLAN: {
              target: '#issueTracking.dashboard',
              actions: 'executePlan'
            },
            MODIFY_PLAN: 'generatingPlan',
            REJECT_PLAN: '#issueTracking.dashboard'
          }
        }
      }
    }
  }
}, {
  actions: {
    initializeSystem: assign({
      metadata: (context) => ({
        ...context.metadata,
        lastSync: Date.now()
      })
    }),

    setRepositoryInfo: assign({
      metadata: (context, event) => ({
        ...context.metadata,
        repository: event.repository
      })
    }),

    selectIssue: assign({
      activeIssue: (context, event) => event.issueId
    }),

    createNewIssue: assign({
      issues: (context, event) => [
        ...context.issues,
        {
          id: `issue-${Date.now()}`,
          title: event.title,
          description: event.description,
          status: 'backlog',
          priority: event.priority || 'medium',
          labels: event.labels || [],
          createdAt: Date.now(),
          assignee: event.assignee
        }
      ],
      analytics: (context) => ({
        ...context.analytics,
        totalIssues: context.analytics.totalIssues + 1
      })
    }),

    transitionToInProgress: assign({
      issues: (context, event) =>
        context.issues.map(issue =>
          issue.id === event.issueId
            ? { ...issue, status: 'inProgress', startedAt: Date.now() }
            : issue
        )
    }),

    addDependency: assign({
      workflow: (context, event) => ({
        ...context.workflow,
        dependencies: [
          ...context.workflow.dependencies,
          {
            source: event.sourceIssue,
            target: event.targetIssue,
            type: event.dependencyType
          }
        ]
      })
    }),

    identifyBlockers: (context, event) => {
      console.log(`🚫 Issue blocked: ${event.reason}`);
    },

    updateMetrics: assign({
      analytics: (context, event) => {
        const issue = context.issues.find(i => i.id === context.activeIssue);
        const timeSpent = issue ? Date.now() - issue.startedAt : 0;

        return {
          ...context.analytics,
          completedIssues: context.analytics.completedIssues + 1,
          averageTime:
            (context.analytics.averageTime * context.analytics.completedIssues + timeSpent) /
            (context.analytics.completedIssues + 1)
        };
      }
    }),

    addToSprintPlan: (context, event) => {
      console.log(`📅 Added to sprint: ${event.issueId}`);
    },

    notifyAssignee: (context, event) => {
      console.log(`📧 Notifying assignee for issue: ${context.activeIssue}`);
    },

    escalateToHighPriority: assign({
      issues: (context, event) =>
        context.issues.map(issue =>
          issue.id === event.issueId
            ? { ...issue, priority: 'critical' }
            : issue
        )
    })
  },

  services: {
    analyzeProjectScope: async (context) => {
      return {
        totalEffort: 'medium',
        estimatedTime: '2 weeks',
        resources: ['developer', 'reviewer', 'tester']
      };
    },

    generateActionPlan: async (context) => {
      return {
        steps: [
          { id: 1, action: 'Setup development environment', duration: '1h' },
          { id: 2, action: 'Implement core functionality', duration: '2d' },
          { id: 3, action: 'Write tests', duration: '4h' },
          { id: 4, action: 'Code review', duration: '2h' },
          { id: 5, action: 'Deploy to staging', duration: '1h' }
        ],
        totalDuration: '3 days',
        dependencies: []
      };
    },

    processAutomation: async (context, event) => {
      return {
        actionsPerformed: ['label-added', 'assignee-set', 'milestone-updated'],
        success: true
      };
    }
  },

  guards: {
    canUnblock: (context, event) => {
      const blockers = context.workflow.blockers.filter(
        b => b.issueId === event.issueId
      );
      return blockers.every(b => b.resolved);
    }
  }
});

export { ISSUE_CONFIG };