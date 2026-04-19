import { Injectable } from '@nestjs/common';

/**
 * Runtime-tunable config served to the eseller-mobile app via
 * `GET /api/config/mobile`. Values live in code for v1 — the contract
 * is stable enough to move to a DB-backed table later without touching
 * the mobile client.
 *
 * Mobile precedence: env default → AsyncStorage cache → this endpoint.
 */

export interface MalchnaasMobileConfig {
  enabled: boolean;
  pilotAimags: string[];
  /** Aimag code → delivery window (e.g. "7-10"). PRD §6.5. */
  aimagDelivery: Record<string, string>;
}

export interface MobileConfigResponse {
  malchnaas: MalchnaasMobileConfig;
}

const PILOT_AIMAGS = ['AKH', 'TOV', 'SEL'];

const AIMAG_DELIVERY: Record<string, string> = {
  AKH: '7-10',
  BOL: '10-14',
  BKH: '7-10',
  BUL: '5-7',
  GOA: '10-14',
  GOS: '5-7',
  DAR: '3-5',
  DOR: '10-14',
  DOG: '5-7',
  DUN: '7-10',
  ZAV: '10-14',
  OVR: '7-10',
  OMN: '7-10',
  SUK: '7-10',
  SEL: '5-7',
  TOV: '3-5',
  UVS: '10-14',
  KHO: '10-14',
  KHV: '10-14',
  KHE: '7-10',
  ORK: '3-5',
};

@Injectable()
export class ConfigMobileService {
  getConfig(): MobileConfigResponse {
    return {
      malchnaas: {
        enabled: true,
        pilotAimags: PILOT_AIMAGS,
        aimagDelivery: AIMAG_DELIVERY,
      },
    };
  }
}
