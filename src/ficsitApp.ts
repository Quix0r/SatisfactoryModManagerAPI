import request from 'request-promise-native';

const API_URL = 'https://api.ficsit.app';
const GRAPHQL_API_URL = `${API_URL}/v2/query`;

export async function fiscitApiQuery(query: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variables?: { [key: string]: any }): Promise<{ [key: string]: any }> {
  try {
    const response = JSON.parse(await request(GRAPHQL_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        query,
        variables,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }));
    return response.data;
  } catch (e) {
    return JSON.parse(e.error);
  }
}

export async function getModDownloadLink(modID: string, version: string): Promise<string> {
  const res = await fiscitApiQuery(`
  query($modID: ModID!, $version: String!){
    getMod(modId: $modID)
    {
      version(version: $version)
      {
        link
      }
    }
  }
  `, { modID, version });
  if (res.errors) {
    throw res.errors;
  } else if (res.getMod.version) {
    return API_URL + res.getMod.version.link;
  } else {
    throw new Error(`${modID}@${version} not found`);
  }
}

interface FicsitAppFetch {
  time: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

const cachedFetch: {[key: string]: FicsitAppFetch} = {};
const fetchCooldown = 5 * 60 * 1000;

function cooldownPassed(action: string): boolean {
  return cachedFetch[action] ? Date.now() - cachedFetch[action].time > fetchCooldown : true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCache(action: string): any {
  return cachedFetch[action]?.data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setCache(action: string, data: any): void {
  cachedFetch[action] = {
    time: Date.now(),
    data,
  };
}


export interface FicsitAppMod {
  name: string;
  short_description: string;
  full_description: string;
  logo: string;
  source_url: string;
  views: number;
  downloads: number;
  hotness: number;
  popularity: number;
  last_version_date: Date;
  authors: Array<FicsitAppAuthor>;
  versions: Array<FicsitAppVersion>;
}

export interface FicsitAppVersion {
  mod_id: string;
  version: string;
  sml_version: string;
  changelog: string;
  downloads: string;
  stability: 'alpha' | 'beta' | 'release';
  link: string;
}

export interface FicsitAppAuthor {
  mod_id: string;
  user: FicsitAppUser;
  role: string;
}

export interface FicsitAppUser {
  username: string;
  avatar: string;
}

export async function getAvailableMods(): Promise<Array<FicsitAppMod>> {
  if (cooldownPassed('getAvailableMods')) {
    const res = await fiscitApiQuery(`
    {
      getMods(filter: {
        limit: 100
      })
      {
        mods
        {
          name,
          short_description,
          full_description,
          id,
          authors
          {
            mod_id,
            user
            {
              username,
              avatar
            },
            role
          },
          versions
          {
            mod_id,
            version,
            sml_version,
            changelog,
            downloads,
            stability,
            link
          }
        }
      }
    }
    `);
    if (res.errors) {
      throw res.errors;
    } else {
      setCache('getAvailableMods', res.getMods.mods);
    }
  }
  return getCache('getAvailableMods');
}


export interface FicsitAppSMLVersion {
  id: string;
  version: string;
  satisfactory_version: number;
  stability: string;
  link: string;
  changelog: string;
  date: string;
}

export async function getAvailableSMLVersions(): Promise<Array<FicsitAppSMLVersion>> {
  if (cooldownPassed('getSMLVersions')) {
    const res = await fiscitApiQuery(`
    {
      getSMLVersions(filter: {limit: 100})
      {
        sml_versions
        {
          id,
          version,
          satisfactory_version
          stability,
          link,
          changelog,
          date
        }
      }
    }
    `);
    if (res.errors) {
      throw res.errors;
    } else {
      setCache('getSMLVersions', res.getSMLVersions.sml_versions);
    }
  }
  return getCache('getSMLVersions');
}
