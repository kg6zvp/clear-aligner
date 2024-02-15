import { AlignmentSide, Link } from '../../structs';
import BCVWP from '../../features/bcvwp/BCVWPSupport';
import { VirtualTable } from '../databaseManagement';
import { v4 as uuidv4 } from 'uuid';

export class VirtualTableLinks extends VirtualTable {
  links: Map<string, Link>;
  sourcesIndex: Map<string, Set<string>>;
  targetsIndex: Map<string, Set<string>>;

  constructor() {
    super();
    this.links = new Map<string, Link>();
    this.sourcesIndex = new Map<string, Set<string>>(); // links a normalized BCVWP reference string to a set of link id strings
    this.targetsIndex = new Map<string, Set<string>>(); // links a normalized BCVWP reference string to a set of link id strings
  }

  save = (link: Link, suppressOnUpdate?: boolean): Link | undefined => {
    const exists = this.exists(link.id);
    if (exists) {
      // remove existing link, sources and targets
      this.remove(link.id);
    }
    try {
      const newLink: Link = {
        ...link,
        id: link.id ?? uuidv4(),
      };
      this.links.set(newLink.id!, newLink);
      this._indexLink(newLink);
      return newLink;
    } catch (e) {
      return undefined;
    } finally {
      this.onUpdate(suppressOnUpdate);
    }
  };

  /**
   * perform indexing on the given link
   * @param link
   */
  _indexLink = (link: Link) => {
    if (!link.id) {
      throw new Error('Cannot index link without an id!');
    }
    // index sources
    link.sources
      .map(BCVWP.parseFromString)
      .map((ref) => ref.toReferenceString())
      .forEach((normalizedRefString) => {
        const linksOnSource =
          this.sourcesIndex.get(normalizedRefString) ?? new Set<string>();
        linksOnSource.add(link.id!);
        this.sourcesIndex.set(normalizedRefString, linksOnSource);
      });

    // index targets
    link.targets
      .map(BCVWP.parseFromString)
      .map((ref) => ref.toReferenceString())
      .forEach((normalizedRefString) => {
        const linksOnSource =
          this.targetsIndex.get(normalizedRefString) ?? new Set<string>();
        linksOnSource.add(link.id!);
        this.targetsIndex.set(normalizedRefString, linksOnSource);
      });
  };

  exists = (id?: string): boolean => {
    if (!id) return false;
    return this.links.has(id);
  };

  saveAll = (links: Link[], suppressOnUpdate?: boolean) => {
    try {
      links.forEach((link) => this.save(link, true));
    } catch (x) {
      console.error('error persisting in bulk', x);
    } finally {
      this.onUpdate(suppressOnUpdate);
    }
  };

  findLinkIdsByWord = (side: AlignmentSide, wordId: BCVWP): string[] => {
    const refString = wordId.toReferenceString();
    const linkIds: string[] = [];
    switch (side) {
      case 'sources':
        (this.sourcesIndex.get(refString) ?? new Set<string>()).forEach((id) =>
          linkIds.push(id)
        );
        break;
      case 'targets':
        (this.targetsIndex.get(refString) ?? new Set<string>()).forEach((id) =>
          linkIds.push(id)
        );
        break;
    }
    return linkIds;
  };

  findByWord = (side: AlignmentSide, wordId: BCVWP): Link[] =>
    this.findLinkIdsByWord(side, wordId)
      .map(this.get)
      .filter((v) => !!v) as Link[];

  getAll = (): Link[] => Array.from(this.links.values());

  get = (id?: string): Link | undefined => {
    if (!id) return undefined;

    return this.links.get(id);
  };

  remove = (id?: string, suppressOnUpdate?: boolean) => {
    if (!this.exists(id)) return undefined;
    const link = this.links.get(id!)!;

    this._removeIndexes(link);

    this.links.delete(link?.id!);

    this.onUpdate(suppressOnUpdate);
  };

  /**
   * remove the indexes created for a given link
   * @param link
   */
  _removeIndexes = (link?: Link) => {
    if (!link || !link.id) return;

    link.sources.forEach((src) => {
      const associatedLinks = this.sourcesIndex.get(src);
      if (!associatedLinks) return;

      associatedLinks.delete(link.id!);

      if (associatedLinks.size < 1) {
        this.sourcesIndex.delete(src);
      }
    });
    link.targets.forEach((tgt) => {
      const associatedLinks = this.targetsIndex.get(tgt);
      if (!associatedLinks) return;

      associatedLinks.delete(link.id!);

      if (associatedLinks.size < 1) {
        this.targetsIndex.delete(tgt);
      }
    });
  };
}
