import React, { useState, useRef, useEffect } from 'react';
import MapView from '../../../../components/MapView';
import ServiceCard from './ServiceCard';
import SearchInput from './SearchInput';

export default function ServicesTab({
  servicesWithDistance,
  hoveredServiceId,
  setHoveredServiceId,
  categorySearch,
  setCategorySearch,
  locationSearch,
  setLocationSearch,
  setSelectedService,
  setIsBookingModalOpen,
  openReviewModal,
  token,
  sortOption,
  setSortOption,
}) {
  const [mapCenter, setMapCenter] = useState(null);
  const [searchRadius, setSearchRadius] = useState();
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapCenter && mapRef.current) {
      mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [mapCenter]);

  const filteredSortedServices = (servicesWithDistance || [])
    .filter((s) => {
      const matchesCategory = categorySearch
        ? s.category?.toLowerCase().includes(categorySearch.toLowerCase())
        : true;

      const matchesLocation = locationSearch
        ? s.location?.toLowerCase().includes(locationSearch.toLowerCase())
        : true;

      const withinRadius =
        searchRadius && s.distance != null ? s.distance <= searchRadius : true;

      return matchesCategory && matchesLocation && withinRadius;
    })
    .sort((a, b) => {
      if (sortOption === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
      if (sortOption === 'distance') return (a.distance || 0) - (b.distance || 0);
      return 0;
    });

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-slate-900">Find Trusted Professionals</h2>
          <p className="mt-1 text-sm text-slate-500">Search verified providers by category, location, rating, and distance.</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
          <SearchInput icon={<></>} placeholder="Search by category..." value={categorySearch} onChange={setCategorySearch} />
          <SearchInput icon={<></>} placeholder="Search by location..." value={locationSearch} onChange={setLocationSearch} />

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <label className="text-sm font-medium text-slate-600">Within (km)</label>
            <input
              type="number"
              value={searchRadius || ""}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-24 rounded-xl border border-slate-200 px-2 py-1 text-sm"
              min={1}
              placeholder="5"
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <label className="text-sm font-medium text-slate-600">Sort</label>
            <select
              value={sortOption || "rating"}
              onChange={(e) => setSortOption?.(e.target.value)}
              className="rounded-xl border border-slate-200 px-2 py-1 text-sm"
            >
              <option value="rating">Rating</option>
              <option value="distance">Distance</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]" ref={mapRef}>
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-slate-900">Service Map</h3>
          <p className="mt-1 text-sm text-slate-500">See available providers by location.</p>
        </div>
        <MapView services={filteredSortedServices} hoveredServiceId={hoveredServiceId} center={mapCenter} />
      </section>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Available Services</h3>
          <span className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">{filteredSortedServices.length} results</span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSortedServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              setMapCenter={setMapCenter}
              setHoveredServiceId={setHoveredServiceId}
              setSelectedService={setSelectedService}
              setIsBookingModalOpen={setIsBookingModalOpen}
              openReviewModal={openReviewModal}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
