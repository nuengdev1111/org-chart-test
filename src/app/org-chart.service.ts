import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Id, OrgNode, PositionTemplate } from './models';

export type DeleteMode = 'cascade' | 'reattach';

export interface OrgState {
  positions: PositionTemplate[];
  nodes: Record<Id, OrgNode>;
  levels: Id[][];
}

function uid(prefix = 'id'): Id {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

@Injectable({ providedIn: 'root' })
export class OrgChartService {
    addLevel() {
  const s = this.snapshot;
  const levels = [...s.levels, []];
  this._state$.next({ ...s, levels });
}

  private readonly _state$ = new BehaviorSubject<OrgState>({
    positions: [],
    nodes: {},
    levels: [[]], 
  });

  readonly state$ = this._state$.asObservable();

  get snapshot(): OrgState {
    return this._state$.value;
  }


  patchState(next: OrgState) {
    this._state$.next(next);
  }

  addPosition(name: string, section: string) {
    const s = this.snapshot;
    const p: PositionTemplate = { id: uid('pos'), name: name.trim(), section: section.trim() };
    this._state$.next({ ...s, positions: [p, ...s.positions] });
    return p;
  }

  ensureLevels(level: number) {
    const s = this.snapshot;
    if (level <= s.levels.length) return;

    const levels = [...s.levels];
    while (levels.length < level) levels.push([]);
    this._state$.next({ ...s, levels });
  }


  canDropIntoLevel(level: number): { ok: boolean; reason?: string } {
    const s = this.snapshot;
    if (level === 1) return { ok: true };

    const prev = s.levels[level - 2] ?? [];
    if (!prev.length) {
      return { ok: false, reason: `Cannot add to Level ${level} because Level ${level - 1} is empty.` };
    }
    return { ok: true };
  }

  createNodeFromPosition(params: {
    position: PositionTemplate;
    level: number;
    parentId: Id | null;
  }): OrgNode {
    const { position, level, parentId } = params;

    this.ensureLevels(level);
    const s = this.snapshot;

    const node: OrgNode = {
      id: uid('node'),
      positionId: position.id,
      name: position.name,
      section: position.section,
      level,
      parentId,
    };

    const levels = s.levels.map(arr => [...arr]);
    levels[level - 1].push(node.id);

    this._state$.next({
      ...s,
      nodes: { ...s.nodes, [node.id]: node },
      levels,
    });

    return node;
  }

  getParentsForLevel(level: number): OrgNode[] {
    if (level <= 1) return [];
    const s = this.snapshot;
    const parentLevelIds = s.levels[level - 2] ?? [];
    return parentLevelIds.map(id => s.nodes[id]).filter(Boolean);
  }

  getChildrenOf(nodeId: Id): OrgNode[] {
    const s = this.snapshot;
    return Object.values(s.nodes).filter(n => n.parentId === nodeId);
  }

  deleteNode(nodeId: Id, mode: DeleteMode) {
    const s = this.snapshot;
    const target = s.nodes[nodeId];
    if (!target) return;

    const parentId = target.parentId;
    const children = this.getChildrenOf(nodeId);

    if (mode === 'cascade') {
      const toDelete = new Set<Id>();
      const stack = [nodeId];

      while (stack.length) {
        const id = stack.pop()!;
        if (toDelete.has(id)) continue;
        toDelete.add(id);

        const kids = Object.values(s.nodes)
          .filter(n => n.parentId === id)
          .map(n => n.id);

        stack.push(...kids);
      }

      const nodes = { ...s.nodes };
      toDelete.forEach(id => delete nodes[id]);

      const levels = s.levels.map(arr => arr.filter(id => !toDelete.has(id)));

      this._state$.next({ ...s, nodes, levels });
      return;
    }


    const nodes = { ...s.nodes };
    children.forEach(c => {
      nodes[c.id] = { ...c, parentId: parentId };
    });

    delete nodes[nodeId];

    const levels = s.levels.map(arr => arr.filter(id => id !== nodeId));

    this._state$.next({ ...s, nodes, levels });
  }

  getAncestors(nodeId: Id): Set<Id> {
    const s = this.snapshot;
    const out = new Set<Id>();
    let cur = s.nodes[nodeId];

    while (cur && cur.parentId) {
      out.add(cur.parentId);
      cur = s.nodes[cur.parentId];
    }
    return out;
  }

  getDescendants(nodeId: Id): Set<Id> {
    const s = this.snapshot;
    const out = new Set<Id>();
    const stack = [nodeId];

    while (stack.length) {
      const id = stack.pop()!;
      const kids = Object.values(s.nodes)
        .filter(n => n.parentId === id)
        .map(n => n.id);

      for (const k of kids) {
        if (!out.has(k)) {
          out.add(k);
          stack.push(k);
        }
      }
    }
    return out;
  }
}
