import { SecondaryIndex, VirtualTable } from '../databaseManagement';
import { VirtualTableLinks } from '../links/tableManager';
import { WordsIndex } from '../links/wordsIndex';
import { v4 as uuidv4 } from 'uuid';
import { CorpusContainer } from '../../structs';

export interface Project {
  id: string;
  name: string;
  abbreviation: string;
  languageCode: string;
  textDirection: string;
  fileName: string;
  linksTable?: VirtualTableLinks;
  linksIndexes?: {
    sourcesIndex: WordsIndex;
    targetsIndex: WordsIndex;
  }
  targetCorpora?: CorpusContainer;
}


export class ProjectTable extends VirtualTable<Project> {
  private readonly projects: Map<string, Project>;

  constructor(targetCorpora?: CorpusContainer) {
    super();
    this.projects = ProjectTable.initializeProjects(targetCorpora);
  }

  private static initializeProjects(targetCorpora?: CorpusContainer): Map<string, Project> {
    const initialProjects = new Map<string, Project>();
    const projectId = uuidv4();
    initialProjects.set(projectId, {
      id: projectId,
      name: "Young’s Literal Translation",
      abbreviation: "YLT",
      languageCode: "eng",
      textDirection: "LTR",
      fileName: "ylt-new.tsv",
      linksTable: new VirtualTableLinks(),
      targetCorpora
    });
    return initialProjects;
  }

  save = (project: Project, suppressOnUpdate?: boolean): Project | undefined => {
    try {
      this.projects.set(project.id, project);
    } catch (e) {
      return undefined;
    } finally {
      this._onUpdate(suppressOnUpdate);
    }
    return project;
  };

  remove = (projectKey: string): boolean => {
    return this.projects.delete(projectKey);
  };

  getProjects = (): Map<string, Project> => {
    return this.projects;
  }

  getProject = (projectKey: string): Project | undefined => {
    return this.projects.get(projectKey);
  }
  catchupNewIndex = async (_index: SecondaryIndex<Project>) => {};
}
