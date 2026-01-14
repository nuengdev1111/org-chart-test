import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { OrgChartService, DeleteMode } from './org-chart.service';
import { Id, OrgNode, PositionTemplate } from './models';

import { PositionDialogComponent } from './dialogs/position-dialog.component';
import { ParentDialogComponent } from './dialogs/parent-dialog.component';
import { DeleteDialogComponent } from './dialogs/delete-dialog.component';

type DragData =
  | { kind: 'template'; position: PositionTemplate }
  | { kind: 'node'; nodeId: Id };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  state$ = this.svc.state$;

  hoveredId: Id | null = null;
  ancestors = new Set<Id>();
  descendants = new Set<Id>();

 
  denyDropToPalette = () => false;


  @ViewChild('boardScroll', { static: false }) boardScroll?: ElementRef<HTMLElement>;
  @ViewChildren('nodeEl', { read: ElementRef }) nodeEls!: QueryList<ElementRef<HTMLElement>>;

  links: Array<{ d: string; color: string }> = [];
  svgW = 0;
  svgH = 0;

  private sub?: Subscription;
  private raf = 0;
  private onResize = () => this.scheduleLinkUpdate();

  constructor(
    private svc: OrgChartService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}


  addLevel() {
    this.svc.addLevel();
    this.scheduleLinkUpdate();
  }

  openCreatePosition() {
    const ref = this.dialog.open(PositionDialogComponent, {
      data: { sections: ['IT', 'Finance', 'HR', 'Sales', 'Other'] },
    });

    ref.afterClosed().subscribe((res: any) => {
      if (!res) return;
      this.svc.addPosition(res.name, res.section);
    });
  }


  templateDragData(p: PositionTemplate): DragData {
    return { kind: 'template', position: p };
  }

  nodeDragData(nodeId: Id): DragData {
    return { kind: 'node', nodeId };
  }

  trackById(_: number, x: string) {
    return x;
  }


  setHover(id: Id | null) {
    this.hoveredId = id;
    if (!id) {
      this.ancestors = new Set();
      this.descendants = new Set();
      return;
    }
    this.ancestors = this.svc.getAncestors(id);
    this.descendants = this.svc.getDescendants(id);
  }

  isAncestor(id: Id) {
    return this.ancestors.has(id);
  }

  isDescendant(id: Id) {
    return this.descendants.has(id);
  }

  parentLabel(node: OrgNode, nodes: Record<Id, OrgNode>) {
    if (!node.parentId) return '—';
    const p = nodes[node.parentId];
    return p ? `${p.name} (${p.section})` : '—';
  }

  childrenCount(nodeId: Id) {
    return this.svc.getChildrenOf(nodeId).length;
  }


  dropToLevel(ev: CdkDragDrop<Id[]>, level: number) {
    const data = ev.item.data as DragData;


    if (data.kind === 'node') {
      if (ev.previousContainer !== ev.container) {
        this.snack.open('Moving existing nodes between levels is disabled.', 'OK', { duration: 2200 });
        return;
      }

      const s = this.svc.snapshot;
      const ids = s.levels[level - 1].slice();

      const from = ev.previousIndex;
      const to = ev.currentIndex;

      const moved = ids.splice(from, 1)[0];
      ids.splice(to, 0, moved);

      const levels = s.levels.map(arr => arr.slice());
      levels[level - 1] = ids;

 
      if ((this.svc as any).patchState) {
        (this.svc as any).patchState({ ...s, levels });
      } else {
        (this.svc as any)._state$?.next?.({ ...s, levels });
      }

      this.scheduleLinkUpdate();
      return;
    }


    const can = this.svc.canDropIntoLevel(level);
    if (!can.ok) {
      this.snack.open(can.reason || 'Cannot drop here.', 'OK', { duration: 2600 });
      return;
    }

    this.svc.ensureLevels(level);

    if (level === 1) {
      this.svc.createNodeFromPosition({ position: data.position, level, parentId: null });
      this.scheduleLinkUpdate();
      return;
    }

    const parents = this.svc.getParentsForLevel(level);
    const ref = this.dialog.open(ParentDialogComponent, { data: { level, parents } });

    ref.afterClosed().subscribe((parentId: Id | null) => {
      if (!parentId) {
        this.snack.open('Cancelled: parent not selected.', 'OK', { duration: 2000 });
        return;
      }
      this.svc.createNodeFromPosition({ position: data.position, level, parentId });
      this.scheduleLinkUpdate();
    });
  }


  askDelete(node: OrgNode) {
    const hasChildren = this.svc.getChildrenOf(node.id).length > 0;
    const ref = this.dialog.open(DeleteDialogComponent, {
      data: { nodeName: node.name, hasChildren },
    });

    ref.afterClosed().subscribe((res: any) => {
      if (!res?.confirm) return;
      this.svc.deleteNode(node.id, res.mode as DeleteMode);
      this.scheduleLinkUpdate();
    });
  }


  ngAfterViewInit(): void {
    this.sub = this.svc.state$.subscribe(() => this.scheduleLinkUpdate());
    this.nodeEls.changes.subscribe(() => this.scheduleLinkUpdate());
    window.addEventListener('resize', this.onResize);


    this.boardScroll?.nativeElement.addEventListener('scroll', this.onScroll, { passive: true });

    this.scheduleLinkUpdate();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    window.removeEventListener('resize', this.onResize);
    this.boardScroll?.nativeElement.removeEventListener('scroll', this.onScroll);
    cancelAnimationFrame(this.raf);
  }

  private onScroll = () => this.scheduleLinkUpdate();

  private scheduleLinkUpdate() {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.updateLinks());
  }

  private colorForSection(section?: string): string {
    const s = (section || 'Other').toLowerCase();
    if (s === 'it') return '#3f51b5';
    if (s === 'finance') return '#009688';
    if (s === 'hr') return '#ff9800';
    if (s === 'sales') return '#e91e63';
    return '#607d8b';
  }

  private updateLinks() {
    const scrollEl = this.boardScroll?.nativeElement;
    if (!scrollEl) return;

    const state = this.svc.snapshot;


    this.svgW = scrollEl.scrollWidth;
    this.svgH = scrollEl.scrollHeight;

    const containerRect = scrollEl.getBoundingClientRect();

    const map = new Map<string, HTMLElement>();
    this.nodeEls.forEach(ref => {
      const el = ref.nativeElement;
      const id = el.dataset['id'];
      if (id) map.set(id, el);
    });

    const links: Array<{ d: string; color: string }> = [];

    for (const node of Object.values(state.nodes)) {
      if (!node.parentId) continue;

      const parentEl = map.get(node.parentId);
      const childEl = map.get(node.id);
      if (!parentEl || !childEl) continue;

      const pr = parentEl.getBoundingClientRect();
      const cr = childEl.getBoundingClientRect();

      const x1 = pr.left - containerRect.left + scrollEl.scrollLeft + pr.width / 2;
      const y1 = pr.top - containerRect.top + scrollEl.scrollTop + pr.height;

      const x2 = cr.left - containerRect.left + scrollEl.scrollLeft + cr.width / 2;
      const y2 = cr.top - containerRect.top + scrollEl.scrollTop;

      const midY = (y1 + y2) / 2;

      const d = `M ${x1} ${y1} V ${midY} H ${x2} V ${y2}`;

      links.push({
        d,
        color: this.colorForSection(state.nodes[node.parentId]?.section),
      });
    }

    this.links = links;
  }
}
