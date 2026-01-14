export type Id = string;

export interface PositionTemplate {
  id: Id;
  name: string;
  section: string;
}

export interface OrgNode {
  id: Id;
  positionId: Id;
  name: string;
  section: string;

  level: number;     
  parentId: Id | null;
}
