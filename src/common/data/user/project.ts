export const ProjectTableName = "project";

export enum ProjectState {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED"
}

export interface ProjectDTO {
  id?: string; // uuid
  name: string;
  // TODO: add Corpora
  state?: ProjectState;
}

export enum ProjectLocation {
  REMOTE = "REMOTE",
  LOCAL = "LOCAL",
  SYNCED = "SYNCED"
}

export class ProjectEntity {
  id?: string; // uuid
  name: string;
  location: ProjectLocation;
  serverState?: ProjectState;
  constructor() {
    this.name = '';
    this.location = ProjectLocation.LOCAL;
  }
}

export const mapProjectDTOToProjectEntity = (dto: ProjectDTO, location: ProjectLocation): ProjectEntity => ({
  id: dto.id,
  name: dto.name,
  serverState: dto.state,
  location
});

export const mapProjectEntityToProjectDTO = (entity: ProjectEntity): ProjectDTO => ({
  id: entity.id,
  name: entity.name,
  state: entity.serverState
})
