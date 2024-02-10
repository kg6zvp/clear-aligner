/* eslint-disable no-restricted-syntax */
import PouchDB from 'pouchdb';
import { InternalLink, PersistentInternalLink, prePersistLink, preRetrieveLink } from './link';
import { Link_SourceColumns, PersistentLink_Source } from './linksSources';
import { Link_TargetColumns, PersistentLink_Target } from './linksTargets';
import { AlignmentSide, Link } from '../../structs';
import BCVWP from '../../features/bcvwp/BCVWPSupport';
import _ from 'lodash';

export class VirtualTableLinks {
  links: PouchDB.Database<PersistentInternalLink>;
  linksSources: PouchDB.Database<PersistentLink_Source>;
  linksTargets: PouchDB.Database<PersistentLink_Target>;

  constructor(links: PouchDB.Database<PersistentInternalLink>, linksSources: PouchDB.Database<PersistentLink_Source>, linksTargets: PouchDB.Database<PersistentLink_Target>) {
    this.links = links;
    this.linksSources = linksSources;
    this.linksTargets = linksTargets;
  }

  save = async (link: Link): Promise<Link | undefined> => {
    const existingLink = !!link.id ? await this.links.get(link.id) : undefined;
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
    return await this.get(newLink.link._id);
  };

  findByWord = async (side: AlignmentSide, wordId: BCVWP): Promise<Link[]> => {
    const links: Link[] = [];
    switch (side) {
      case 'sources':
        const sourceLinkIds = _.uniqWith((await this.linksSources.find({
          selector: {
            sourceWordOrPart: { $eq: wordId.toReferenceString() }
          },
          sort: [Link_SourceColumns.sourceWordOrPart]
        })).docs
        .map(({ linkId }) => linkId), _.isEqual);
        for (let linkId of sourceLinkIds) {
          const link = await this.get(linkId);
          if (link) {
            links.push(link);
          }
        }
        break;
      case 'targets':
        const targetLinkIds = _.uniqWith((await this.linksTargets.find({
          selector: {
            targetWordOrPart: { $eq: wordId.toReferenceString() }
          },
          sort: [Link_TargetColumns.targetWordOrPart]
        })).docs
          .map(({ linkId }) => linkId), _.isEqual);
        for (let linkId of targetLinkIds) {
          const link = await this.get(linkId);
          if (link) {
            links.push(link);
          }
        }
        break;
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
  };

  _getInternalLink = async (id?: string): Promise<InternalLink|undefined> => {
    if (!id) return undefined;

    // retrieve all parts
    const link = await this.links.get(id);
    if (!link) return undefined;
    const sources = await this._getSources(link);
    const targets = await this._getTargets(link);

    return {
      link,
      sources,
      targets
    };
  }

  _getSources = async (link: PersistentInternalLink & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta): Promise<PouchDB.Core.ExistingDocument<PersistentLink_Source>[]> => {
    return (await this.linksSources.find({
      selector: {
        linkId: { $eq: link._id }
      }, sort: [Link_SourceColumns.sourceWordOrPart]
    })).docs;
  };

  _getTargets = async (link: PersistentInternalLink & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta): Promise<PouchDB.Core.ExistingDocument<PersistentLink_Target>[]> => {
    return (await this.linksTargets.find({
      selector: {
        linkId: { $eq: link._id }
      }, sort: [Link_TargetColumns.targetWordOrPart]
    })).docs;
  }
}

/**
 * create virtual links table with all necessary indexes
 */
export const createVirtualTableLinks = (): VirtualTableLinks => {
  const linksDB = new PouchDB('links', { revs_limit: 1 }) as PouchDB.Database<PersistentInternalLink>;
  const sourcesDB = new PouchDB('links_sources', { revs_limit: 1 }) as PouchDB.Database<PersistentLink_Source>;
  const targetsDB = new PouchDB('links_targets', { revs_limit: 1 }) as PouchDB.Database<PersistentLink_Target>;

  [linksDB, sourcesDB, targetsDB].forEach(db => db.on('error', (error: any) => {
    console.error(error);
    debugger;
  }));

  console.log('sourceColumns', Object.values(Link_SourceColumns));
  console.log('targetColumns', Object.values(Link_TargetColumns));

  Object.values(Link_SourceColumns)
    .forEach((indexProp) => sourcesDB.createIndex({
      index: {
        fields: [indexProp]
      }
    }));
  Object.values(Link_TargetColumns)
    .forEach((indexProp) => targetsDB.createIndex({
      index: {
        fields: [indexProp]
      }
    }));

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
