import { ProjectEntity } from '../data/user/project';

export interface UserRepositoryIFace {
  projectPersist: (p: ProjectEntity) => Promise<ProjectEntity>;
  projectSave: (p: ProjectEntity) => Promise<ProjectEntity>;
}
