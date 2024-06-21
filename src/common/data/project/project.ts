import { AlignmentSide, CorpusDTO } from './corpus';
import { Corpus, CorpusViewType, LanguageInfo, SyntaxRoot, TextDirection, Verse, Word } from '../../../structs';
import { LanguageDTO, TextDirectionDTO } from './language';

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
  corpora: (dto.corpora || []).map(mapCorpusDTOToCorpusEntity)
});

export const mapProjectEntityToProjectDTO = (entity: ProjectEntity): ProjectDTO => ({
  id: entity.id,
  name: entity.name,
  state: entity.serverState,
  corpora: (entity.corpora || []).map(mapCorpusEntityToCorpusDTO)
})

export const mapCorpusEntityToCorpusDTO = (entity: Corpus): CorpusDTO => {
  return {
    id: entity.id,
    name: entity.name,
    side: AlignmentSide[entity.side as keyof typeof AlignmentSide],
    fullName: entity.fullName,
    fileName: entity.fileName || "",
    language: mapLanguageEntityToLanguageDTO(entity.language),
    languageCode: entity.language.code
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
    viewType: CorpusViewType.Paragraph
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
