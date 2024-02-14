/* eslint-disable no-restricted-syntax */
import PouchDB from 'pouchdb';
import { InternalLink, PersistentInternalLink, prePersistLink, preRetrieveLink } from './link';
import { Link_SourceColumns, PersistentLink_Source } from './linksSources';
import { Link_TargetColumns, PersistentLink_Target } from './linksTargets';
import { AlignmentSide, Link } from '../../structs';
import BCVWP from '../../features/bcvwp/BCVWPSupport';
import _ from 'lodash';
import FindPlugin from 'pouchdb-find';
import { VirtualTable } from '../databaseManagement';

PouchDB.plugin(FindPlugin);

export class VirtualTableLinks extends VirtualTable {
  links: PouchDB.Database<PersistentInternalLink>;
  linksSources: PouchDB.Database<PersistentLink_Source>;
  linksTargets: PouchDB.Database<PersistentLink_Target>;

  constructor(links: PouchDB.Database<PersistentInternalLink>, linksSources: PouchDB.Database<PersistentLink_Source>, linksTargets: PouchDB.Database<PersistentLink_Target>) {
    super();
    this.links = links;
    this.linksSources = linksSources;
    this.linksTargets = linksTargets;
  }

  save = async (link: Link): Promise<Link | undefined> => {
    const existingLink = !!link.id ? await this._getPersistentInternalLink(link.id) : undefined;
    if (existingLink) { // remove existing link, sources and targets
      await this.remove(existingLink._id);
    }
    const newLink = prePersistLink(link);
    await this.links.put(newLink.link);
    for (let src of newLink.sources) {
      await this.linksSources.put(src);
    }
    for (let tgt of newLink.targets) {
      await this.linksTargets.put(tgt);
    }
    try {
      const v = await this.get(newLink.link._id)
        .catch((e) => {
          console.log('caught error', e);
        });
      if (v) {
        return v;
      } else {
        return undefined;
      }
    } catch(e) {
      return undefined;
    } finally {
      this.onUpdate();
    }
  };

  saveAll = async (links: Link[], suppressOnUpdate?: boolean) => {
    const linkRoots: PersistentInternalLink[] = [];
    const linksSources: PersistentLink_Source[] = [];
    const linksTargets: PersistentLink_Target[] = [];

    links.map(prePersistLink)
      .forEach((link) => {
        linkRoots.push(link.link);
        link.sources.forEach((src) => linksSources.push(src));
        link.targets.forEach((tgt) => linksTargets.push(tgt));
      });

    const rootsPromise = this.links.bulkDocs(linkRoots);
    const sourcesPromise = this.linksSources.bulkDocs(linksSources);
    const targetsPromise = this.linksTargets.bulkDocs(linksTargets);

    try {
      await Promise.all([rootsPromise, sourcesPromise, targetsPromise]);
    } catch (x) {
      console.error('error persisting in bulk', x);
    } finally {
      if (!suppressOnUpdate) {
        this.onUpdate();
      }
    }
  }

  findByWord = async (side: AlignmentSide, wordId: BCVWP): Promise<Link[]> => {
    const linkIds: string[] = [];
    const links: Link[] = [];
    switch (side) {
      case 'sources':
        _.uniqWith((await this.linksSources.find({
          selector: {
            $and: [
              { sourceWordOrPart: { $eq: wordId.toReferenceString() } },
              { book: { $eq: wordId.book } }
            ]
          },
        })).docs
        .map(({ linkId }) => linkId), _.isEqual)
          .forEach((id) => linkIds.push(id));
        break;
      case 'targets':
        _.uniqWith((await this.linksTargets.find({
          selector: {
            $and: [
              { targetWordOrPart: { $eq: wordId.toReferenceString() } },
              { book: { $eq: wordId.book } }
            ]
          },
        })).docs
          .map(({ linkId }) => linkId), _.isEqual)
          .forEach((id) => linkIds.push(id));
        break;
    }
    for (let linkId of linkIds) {
      const link = await this.get(linkId);
      if (link) {
        links.push(link);
      }
    }
    return links;
  }

  getAll = async (): Promise<Link[]> => {
    const linkIds = (await this.links.allDocs({ include_docs: true })).rows
      .map(({ doc }) => doc)
      .filter((v) => v?._id);
    const links: Link[] = [];
    for (let link of linkIds) {
      const tmpLink: InternalLink = {
        link: link!,
        sources: await this._getSources(link!),
        targets: await this._getTargets(link!)
      };
      links.push(preRetrieveLink(tmpLink));
    }
    return links;
  }

  get = async (id?: string): Promise<Link | undefined> => {
    if (!id) return undefined;

    const internalLink = await this._getInternalLink(id);
    if (!internalLink) return undefined;

    // reconstitute into Link object familiar to user
    return preRetrieveLink(internalLink);
  };

  remove = async (id?: string) => {
    if (!id) return undefined;
    const link = await this.links.get(id);
    if (!link) return undefined;
    const sources = await this._getSources(link);
    const targets = await this._getTargets(link);

    await this.links.remove(link);
    for (let source of sources) {
      await this.linksSources.remove(source);
    }
    for (let target of targets) {
      await this.linksTargets.remove(target);
    }

    this.onUpdate();
  };

  _getInternalLink = async (id?: string): Promise<InternalLink|undefined> => {
    // retrieve all parts
    const link = await this._getPersistentInternalLink(id);
    if (!link) return undefined;
    const sources = await this._getSources(link);
    const targets = await this._getTargets(link);

    return {
      link,
      sources,
      targets
    };
  }

  _getPersistentInternalLink = async (id?: string): Promise<PersistentInternalLink & PouchDB.Core.GetMeta|undefined> => {
    try {
      if (!id) return undefined;
      return await this.links.get(id);
    } catch (x) {
      return undefined;
    }
  }

  _getSources = async (link: PersistentInternalLink & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta): Promise<PouchDB.Core.ExistingDocument<PersistentLink_Source>[]> => {
    return (await this.linksSources.find({
      selector: {
        linkId: { $eq: link._id }
      },
    })).docs
      .sort((a, b) => BCVWP.compare(BCVWP.parseFromString(a.sourceWordOrPart), BCVWP.parseFromString(b.sourceWordOrPart)));
  };

  _getTargets = async (link: PersistentInternalLink & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta): Promise<PouchDB.Core.ExistingDocument<PersistentLink_Target>[]> => {
    return (await this.linksTargets.find({
      selector: {
        linkId: { $eq: link._id }
      },
    })).docs
      .sort((a, b) => BCVWP.compare(BCVWP.parseFromString(a.targetWordOrPart), BCVWP.parseFromString(b.targetWordOrPart)));
  }

  close = async () => {
    await this.links.close();
    await this.linksSources.close();
    await this.linksTargets.close();
  }
}

/**
 * create virtual links table with all necessary indexes
 */
export const createVirtualTableLinks = async (): Promise<VirtualTableLinks> => {
  const linksDB = new PouchDB('links', { revs_limit: 1 }) as PouchDB.Database<PersistentInternalLink>;
  await linksDB.info();
  const sourcesDB = new PouchDB('links_sources', { revs_limit: 1 }) as PouchDB.Database<PersistentLink_Source>;
  await sourcesDB.info();
  const targetsDB = new PouchDB('links_targets', { revs_limit: 1 }) as PouchDB.Database<PersistentLink_Target>;
  await targetsDB.info();

  [linksDB, sourcesDB, targetsDB].forEach(db => db.on('error', (error: any) => {
    console.error(error);
    debugger;
  }));

  await sourcesDB.createIndex({
    index: {
      fields: [Link_SourceColumns.linkId]
    }
  });
  await sourcesDB.createIndex({
    index: {
      fields: [Link_SourceColumns.sourceWordOrPart, Link_SourceColumns.book]
    }
  });
  /*for (let column of Object.values(Link_SourceColumns)) {
    await sourcesDB.createIndex({
      index: {
        fields: [column]
      }
    });
  }//*/
  await targetsDB.createIndex({
    index: {
      fields: [Link_TargetColumns.linkId]
    }
  });

  await targetsDB.createIndex({
    index: {
      fields: [Link_TargetColumns.targetWordOrPart, Link_TargetColumns.book]
    }
  });
  /*for (let column of Object.values(Link_TargetColumns)) {
    await targetsDB.createIndex({
      index: {
        fields: [column]
      }
    });
  }//*/

  return new VirtualTableLinks(linksDB, sourcesDB, targetsDB);
};
/**
 * trigger a re-index for data in the links table
 * @param linksTable
 */
export const reindexTableLinks = async (linksTable: VirtualTableLinks) => {
  await linksTable.links.viewCleanup();
  await linksTable.linksSources.viewCleanup();
  await linksTable.linksTargets.viewCleanup();
};
