import { SecondaryIndex, VirtualTable } from '../databaseManagement';
import { WordsIndex } from '../links/wordsIndex';
import { AlignmentSide, Corpus, CorpusContainer, Word } from '../../structs';
import { LinksTable } from '../links/tableManager';
import BCVWP, { BCVWPField } from '../../features/bcvwp/BCVWPSupport';
import _ from 'lodash';

export interface Project {
  id: string;
  name: string;
  abbreviation: string;
  languageCode: string;
  textDirection: string;
  fileName: string;
  linksTable?: LinksTable;
  linksIndexes?: {
    sourcesIndex: WordsIndex;
    targetsIndex: WordsIndex;
  };
  sourceCorpora?: CorpusContainer;
  targetCorpora?: CorpusContainer;
}


export class ProjectTable extends VirtualTable<Project> {
  private projects: Map<string, Project>;

  constructor() {
    super();
    this.projects = new Map();
  }

  save = async (project: Project, suppressOnUpdate?: boolean): Promise<Project | undefined> => {
    try {
      // @ts-ignore
      const createdProject = await window.databaseApi.createSourceFromProject(ProjectTable.convertToDto(project));
      await this.insertWordsOrParts(project);
      this.projects.set(createdProject.id, createdProject);
      return createdProject?.[0] ? ProjectTable.convertDataSourceToProject(createdProject?.[0]) : undefined;
    } catch (e) {
      console.error('Error creating project: ', e);
      return undefined;
    } finally {
      this._onUpdate(suppressOnUpdate);
    }
  };

  remove = async (projectId: string, suppressOnUpdate = false) => {
    try {
      // @ts-ignore
      await window.databaseApi.removeSource(projectId);
      this.projects.delete(projectId);
    } catch (e) {
      console.error('Error deleting project: ', e);
    } finally {
      this._onUpdate(suppressOnUpdate);
    }
  };

  update = async (project: Project, suppressOnUpdate = false): Promise<Project | undefined> => {
    try {
      // @ts-ignore
      const updatedProject = await window.databaseApi.updateSourceFromProject(ProjectTable.convertToDto(project));
      await this.insertWordsOrParts(project);
      this.projects.set(updatedProject, updatedProject);
      return updatedProject?.[0] ? ProjectTable.convertDataSourceToProject(updatedProject?.[0]) : undefined;
    } catch (e) {
      return undefined;
    } finally {
      this._onUpdate(suppressOnUpdate);
    }
  };

  insertWordsOrParts = async (project: Project) => {
    // @ts-ignore
    await window.databaseApi.removeTargetWordsOrParts(project.id).catch(console.error);
    const wordsOrParts = [...(project.sourceCorpora?.corpora ?? []), ...(project.targetCorpora?.corpora ?? [])]
      .flatMap(corpus => (corpus.words ?? [])
        .filter((word) => !((word.text ?? '').match(/^\p{P}$/gu)))
        .map((w: Word) => ProjectTable.convertWordToDto(w, corpus)));

    const insertPromises = _.chunk(wordsOrParts, 2_000)
      .map(chunk => {
        // @ts-ignore
        window.databaseApi.insert(project.id, 'words_or_parts', chunk).catch(console.error);
      });
    await Promise.all(insertPromises);
  }

  getDataSourcesAsProjects = async (): Promise<Project[] | undefined> => {
    try {
      // @ts-ignore
      const projects: { id: string; corpora: Corpus[] }[] | undefined = await window.databaseApi.getDataSources();
      while (!projects) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return (projects || [])
        .filter(project => project?.corpora?.length)
        .map(ProjectTable.convertDataSourceToProject);
    } catch (ex) {
      console.error('Unable to convert data source to project: ', ex);
      return;
    }
  };

  getProjects = async (requery = false): Promise<Map<string, Project> | undefined> => {
    if (requery) {
      const projects = await this.getDataSourcesAsProjects();
      if (projects) {
        this.projects = new Map<string, Project>(projects.filter(p => p).map(p => [p.id, p]));
      }
    }
    return this.projects;
  };

  hasBcvInSource = async (sourceName: string, bcvId: string) => {
    // @ts-ignore
    return await window.databaseApi.hasBcvInSource(sourceName, bcvId.trim()).catch(console.error);
  }

  static convertDataSourceToProject = (dataSource: { id: string, corpora: Corpus[] }) => {
    const corpora = dataSource?.corpora || [];
    const sourceCorpora = corpora.filter((c: Corpus) => c.side === AlignmentSide.SOURCE);
    const targetCorpus = corpora.filter((c: Corpus) => c.side === AlignmentSide.TARGET)[0];

    return {
      id: dataSource.id,
      name: targetCorpus?.fullName,
      abbreviation: targetCorpus?.name,
      languageCode: targetCorpus?.language.code,
      textDirection: targetCorpus?.language.textDirection,
      fileName: targetCorpus?.fileName ?? '',
      sourceCorpora: CorpusContainer.fromIdAndCorpora(AlignmentSide.SOURCE, sourceCorpora),
      targetCorpora: CorpusContainer.fromIdAndCorpora(AlignmentSide.TARGET, [targetCorpus])
    } as Project;
  };

  static convertWordToDto = (word: Word, corpus: Corpus) => {
    const bcv = BCVWP.parseFromString(word.id);
    return ({
      id: `${word.side}:${BCVWP.sanitize(word.id)}`,
      corpus_id: corpus.id,
      text: word.text,
      after: word.after,
      gloss: word.gloss,
      position_book: bcv.book,
      position_chapter: bcv.chapter,
      position_verse: bcv.verse,
      position_word: bcv.word,
      position_part: bcv.part,
      normalized_text: (word.text || '').toLowerCase(),
      source_verse_bcvid: word.sourceVerse,
      language_id: corpus.language.code,
      side: word.side
    });
  };

  static convertToDto = (project: Project) => ({
    id: project.id,
    name: project.name,
    corpora: [...(project.sourceCorpora?.corpora || []), ...(project.targetCorpora?.corpora || [])]
  });

  catchUpIndex = async (_index: SecondaryIndex<Project>) => {
  };
}
