import { CorpusDTO } from './corpus';
import {
  Corpus,
  CorpusContainer,
  CorpusViewType,
  LanguageInfo,
  TextDirection,
} from '../../../structs';
import { LanguageDTO, TextDirectionDTO } from './language';
import { Project } from '../../../state/projects/tableManager';

export const ProjectTableName = "project";

export enum ProjectState {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED"
}

export interface ProjectDTO {
  id?: string; // uuid
  name: string;
  state?: ProjectState;
  corpora: CorpusDTO[];
  lastUpdated?: number;
  lastSyncTime?: number;
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
  lastSyncTime?: number;
  lastUpdated?: number;
  corpora?: Corpus[];
  constructor() {
    this.name = '';
    this.location = ProjectLocation.LOCAL;
  }
}

export const mapProjectDTOToProjectEntity = (dto: ProjectDTO, location: ProjectLocation): ProjectEntity => ({
  id: dto.id,
  name: dto.name,
  serverState: dto.state,
  location,
  corpora: (dto.corpora || []).map(mapCorpusDTOToCorpusEntity),
  lastUpdated: dto.lastUpdated,
  lastSyncTime: dto.lastSyncTime
});

export const mapProjectEntityToProjectDTO = (project: Project): ProjectDTO => ({
  id: project.id,
  name: project.name,
  state: ProjectState.DRAFT,
  corpora: [project.targetCorpora, project.sourceCorpora].map(mapCorpusEntityToCorpusDTO).filter(Boolean) as CorpusDTO[],
  lastSyncTime: project.lastSyncTime,
  lastUpdated: project.lastUpdated
})

export const mapCorpusEntityToCorpusDTO = (container?: CorpusContainer): CorpusDTO | undefined => {
  const corpus = (container?.corpora || [])[0];
  if(!corpus) return;
  return {
    id: corpus.id,
    name: corpus.name,
    side: corpus.side,
    fullName: corpus.fullName,
    fileName: corpus.fileName || "",
    language: mapLanguageEntityToLanguageDTO(corpus.language),
    languageCode: corpus.language.code,
  }
}

export const mapCorpusDTOToCorpusEntity = (dto: CorpusDTO): Corpus => {
  return {
    id: dto.id,
    name: dto.name,
    fullName: dto.fullName,
    language: mapLanguageDTOToLanguageEntity(dto.language),
    side: String(dto.side),
    words: [],
    wordsByVerse: {},
    wordLocation: new Map(),
    books: {},
    fileName: dto.fileName,
    fullText: "",
    viewType: CorpusViewType.Paragraph,
  }
}

export const mapLanguageDTOToLanguageEntity = (dto: LanguageDTO): LanguageInfo => {
  return {
    code: dto.code,
    textDirection: dto.textDirection as unknown as TextDirection,
    fontFamily: dto.fontFamily
  }
}

export const mapLanguageEntityToLanguageDTO = (entity: LanguageInfo): LanguageDTO => {
  return {
    code: entity.code,
    textDirection: entity.textDirection as unknown as TextDirectionDTO,
    fontFamily: entity.fontFamily || ""
  }
}
