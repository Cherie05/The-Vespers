import React from 'react';
import { Map, Navigation } from 'lucide-react';

export const BRICS_REGIONS = [
  {
    id: 'punjab_in_pk',
    name: 'Punjab Trans-Boundary Corridor (IN/PK)',
    lat: 31.634,
    lng: 74.872,
    zoom: 10,
    country: 'India / Pakistan',
    tag: 'Agricultural Stubble & Smog'
  },
  {
    id: 'mpumalanga_za',
    name: 'Mpumalanga Highveld Corridor (ZA/MZ)',
    lat: -25.872,
    lng: 29.233,
    zoom: 9,
    country: 'South Africa',
    tag: 'Coal & Heavy Smelter Belt'
  },
  {
    id: 'amazon_br_bo',
    name: 'Amazon Agro-Frontier (BR/BO)',
    lat: -9.975,
    lng: -67.824,
    zoom: 9,
    country: 'Brazil / Bolivia',
    tag: 'Biomass Burning & Deforestation'
  },
  {
    id: 'delhi_ncr',
    name: 'Delhi NCR Industrial Cluster (IN)',
    lat: 28.669,
    lng: 77.453,
    zoom: 11,
    country: 'India',
    tag: 'Brick Kiln & Inversion'
  },
  {
    id: 'yangtze_cn',
    name: 'Yangtze Maritime Corridor (CN)',
    lat: 31.230,
    lng: 121.473,
    zoom: 10,
    country: 'China',
    tag: 'Petrochemical & Port Flare'
  }
];

export default function RegionSelector({ currentRegion, onSelectRegion, t }) {
  return (
    <div className="region-selector-wrap">
      <Map size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
      <select
        value={currentRegion.id}
        onChange={(e) => {
          const found = BRICS_REGIONS.find((r) => r.id === e.target.value);
          if (found) onSelectRegion(found);
        }}
        className="region-select-dropdown"
        aria-label="Select BRICS Corridor"
      >
        {BRICS_REGIONS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
