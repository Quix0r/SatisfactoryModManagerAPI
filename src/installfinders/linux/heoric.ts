import fs from 'fs';
import { execSync } from 'child_process';
import {
  debug,
} from '../../logging';
import { SatisfactoryInstall } from '../../satisfactoryInstall';
import { InstallFindResult } from '../baseInstallFinder';

interface HeroicGame {
  app_name: string;
  base_urls: string[];
  can_run_offline: boolean;
  egl_guid: string;
  executable: string;
  install_path: string;
  install_size: number;
  is_dlc: boolean;
  launch_parameters: string;
  manifest_path: string;
  needs_verification: boolean;
  requires_ot: boolean;
  save_path: string;
  title: string;
  version: string;
}

interface HeroicData {
  [name: string]: HeroicGame;
}

interface HeroicConfig {
  [appname: string]: {
    wine_prefix?: string;
    WINEPREFIX?: string;
  }
}

const HEROIC_DATA_PATH = `${process.env.HOME}/.config/heroic/lib-cache/library.json`;

export function getInstalls(): InstallFindResult {
  const installs: Array<SatisfactoryInstall> = [];
  const invalidInstalls: Array<string> = [];
  if (fs.existsSync(HEROIC_DATA_PATH)) {
    const heroicInstalls = JSON.parse(fs.readFileSync(HEROIC_DATA_PATH, 'utf8')) as HeroicData;
    Object.values(heroicInstalls.library).forEach((heroicGame) => {
      if (heroicGame.app_name.includes('Crab')) {
        let canLaunch = false;
        try {
          execSync('heroic', { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' });
          canLaunch = true;
        } catch (e) {
          // heroic executable not found
        }
        installs.push(new SatisfactoryInstall(
          `${heroicGame.title} (Heroic)`,
          heroicGame.install.version,
          heroicGame.app_name.substr('Crab'.length),
          heroicGame.install.install_path,
          canLaunch ? `heroic launch ${heroicGame.app_name}` : undefined,
        ));
      }
    });
    return { installs, invalidInstalls };
  }
  debug('Heroic is not installed');

  return { installs: [], invalidInstalls: [] };
}
