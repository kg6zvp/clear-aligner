// https://pouchdb.com/2014/05/01/secondary-indexes-have-landed-in-pouchdb.html

/**
 * This is meant to represent the functions that are supposed to be in an index/query
 *
 * note: didn't find this in the types for PouchDB so I defined it from examples given on the site
 */
interface PouchDBViewDefinition {
  /**
   * function to return or `emit(value)` the desired result of the indexing operation
   *
   * meant to be set by calling function.toString()
   */
  map: string;
  /**
   * function designed to perform aggregations on the results
   *
   * meant to be set by calling function.toString()
   */
  reduce?: string;
}

/**
 * Create a design document for PouchDB (represents an index)
 * @param name: name of index
 * @param mapFunction index value function
 * @param reduceFunction aggregation function
 */
export const createDesignDoc = <T>(name: string, mapFunction: (obj: T) => any, reduceFunction?: (obj: T) => any): PouchDB.Core.PutDocument<any> => {
  const doc = {
    _id: `_design/${name}`,
    views: {
      [`${name}`]: {
        map: mapFunction.toString()
      } as PouchDBViewDefinition
    }
  }
  if (reduceFunction) {
    doc.views[name].reduce = reduceFunction.toString();
  }
  return doc;
}
