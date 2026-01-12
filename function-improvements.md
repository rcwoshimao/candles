# Performance Optimization Plan for Candles App
*Optimizing React performance without Node.js integration*

## **Timeline Overview**

| Phase | Duration | Effort Level | Priority |
|-------|----------|--------------|----------|
| Phase 1: Database & Query Optimization | 1 week | Medium | High |
| Phase 2: React Performance Optimization | 1 week | Medium | High |
| Phase 3: Map Performance Optimization | 1 week | High | High |
| Phase 4: Bundle & Loading Optimization | 1 week | Medium | Medium |
| Phase 5: Real-time Optimization | 1 week | High | Medium |
| Phase 6: Emotion System Optimization | 1 week | Low | Low |

**Total Timeline: 6 weeks**
**Total Effort: 30-40 hours**

---

## **Phase 1: Database & Query Optimization (Week 1)**

### **Timeline: 5-7 hours**
- **Day 1-2**: Database indexes and query optimization
- **Day 3-4**: Implement pagination
- **Day 5**: Viewport-based loading

### **What to Change:**

#### **1.1 Add Database Indexes**
```sql
-- Add these to your Supabase database
CREATE INDEX idx_markers_created_at ON markers(created_at DESC);
CREATE INDEX idx_markers_user_id ON markers(user_id);
CREATE INDEX idx_markers_emotion ON markers(emotion);
CREATE INDEX idx_markers_position ON markers USING GIST (position);
CREATE INDEX idx_markers_user_timestamp ON markers(user_timestamp DESC);
```

#### **1.2 Implement Pagination**
- Replace `SELECT * FROM markers` with paginated queries
- Add `range()` parameters to Supabase queries
- Implement infinite scroll or pagination UI

#### **1.3 Viewport-Based Loading**
- Only fetch markers in current map bounds
- Add bounds filtering to Supabase queries
- Implement dynamic loading based on map movement

### **Expected Impact:**
- **50-70% faster initial load**
- **Reduced database load**
- **Better scalability**

---

## **Phase 2: React Performance Optimization (Week 2)**

### **Timeline: 6-8 hours**
- **Day 1-2**: Install and configure React Query
- **Day 3-4**: Refactor data fetching logic
- **Day 5**: Implement component memoization

### **What to Change:**

#### **2.1 Add React Query**
```bash
npm install @tanstack/react-query
```

#### **2.2 Create Custom Hooks**
- `useMarkers()` - For fetching markers with caching
- `useCreateMarker()` - For creating new markers
- `useDeleteMarker()` - For deleting markers

#### **2.3 Memoize Components**
- Wrap `Candle` component with `React.memo()`
- Memoize `EmotionDistributionChart`
- Optimize `EmotionWheel` rendering

#### **2.4 Optimize State Management**
- Use `useMemo()` for expensive calculations
- Implement proper dependency arrays
- Reduce unnecessary re-renders

### **Expected Impact:**
- **60-80% reduction in unnecessary re-renders**
- **Better caching and data management**
- **Improved user experience**

---

## **Phase 3: Map Performance Optimization (Week 3)**

### **Timeline: 8-10 hours**
- **Day 1-2**: Implement marker clustering
- **Day 3-4**: Viewport-based rendering
- **Day 5**: Icon caching and optimization

### **What to Change:**

#### **3.1 Add Marker Clustering**
```bash
npm install react-leaflet-markercluster
```

#### **3.2 Implement Viewport Rendering**
- Only render markers in current map view
- Add bounds-based filtering
- Implement dynamic marker loading

#### **3.3 Optimize Candle Icons**
- Cache icon creation
- Implement icon pooling
- Reduce DOM manipulation

#### **3.4 Map Event Optimization**
- Debounce map movement events
- Optimize zoom level calculations
- Implement efficient bounds checking

### **Expected Impact:**
- **70-90% smoother map interactions**
- **Reduced memory usage**
- **Better performance with many markers**

---

## **Phase 4: Bundle & Loading Optimization (Week 4)**

### **Timeline: 5-7 hours**
- **Day 1-2**: Implement code splitting
- **Day 3-4**: Lazy load components
- **Day 5**: Optimize Vite configuration

### **What to Change:**

#### **4.1 Code Splitting**
- Lazy load `MapComponent`
- Lazy load `Sidebar`
- Lazy load chart components

#### **4.2 Bundle Optimization**
- Configure manual chunks in Vite
- Optimize dependency loading
- Implement tree shaking

#### **4.3 Loading States**
- Add proper loading indicators
- Implement skeleton screens
- Optimize loading UX

### **Expected Impact:**
- **30-50% smaller bundle size**
- **Faster initial page load**
- **Better perceived performance**

---

## **Phase 5: Real-time Optimization (Week 5)**

### **Timeline: 6-8 hours**
- **Day 1-2**: Optimize Supabase subscriptions
- **Day 3-4**: Implement debouncing
- **Day 5**: Add error handling and retry logic

### **What to Change:**

#### **5.1 Optimize Subscriptions**
- Filter subscriptions by viewport
- Implement connection pooling
- Add subscription cleanup

#### **5.2 Debounce Updates**
- Debounce real-time updates
- Implement update batching
- Add update queuing

#### **5.3 Error Handling**
- Add retry logic for failed connections
- Implement fallback mechanisms
- Add connection status indicators

### **Expected Impact:**
- **50-70% more efficient real-time updates**
- **Better connection stability**
- **Reduced unnecessary updates**

---

## **Phase 6: Emotion System Optimization (Week 6)**

### **Timeline: 3-5 hours**
- **Day 1-2**: Cache emotion calculations
- **Day 3-4**: Optimize emotion wheel
- **Day 5**: Final performance testing

### **What to Change:**

#### **6.1 Cache Emotion Data**
- Cache emotion mappings
- Memoize emotion calculations
- Optimize emotion wheel rendering

#### **6.2 Optimize Emotion Wheel**
- Memoize wheel positions
- Optimize animation performance
- Reduce DOM queries

### **Expected Impact:**
- **40-60% faster emotion selection**
- **Smoother animations**
- **Reduced computation overhead**

---

## **Implementation Strategy**

### **Week-by-Week Approach:**
1. **Week 1**: Focus on database - biggest impact, lowest risk
2. **Week 2**: React optimization - foundation for other improvements
3. **Week 3**: Map performance - most complex, highest user impact
4. **Week 4**: Bundle optimization - quick wins, good ROI
5. **Week 5**: Real-time - important for user experience
6. **Week 6**: Polish and final optimizations

### **Testing Strategy:**
- **Performance testing** after each phase
- **User experience testing** with real data
- **Browser compatibility** testing
- **Mobile performance** validation

### **Rollback Plan:**
- **Feature flags** for major changes
- **Git branches** for each phase
- **Performance monitoring** throughout
- **Quick rollback** capability

---

## **Expected Overall Improvements**

### **Performance Metrics:**
- **Initial Load Time**: 60-80% faster
- **Map Rendering**: 70-90% smoother
- **Real-time Updates**: 50-70% more efficient
- **Bundle Size**: 30-50% smaller
- **Memory Usage**: 40-60% reduction
- **User Experience**: Significantly improved

### **User Experience Improvements:**
- **Faster page loads**
- **Smoother interactions**
- **Better mobile performance**
- **Reduced loading states**
- **More responsive UI**

### **Technical Benefits:**
- **Better code maintainability**
- **Improved scalability**
- **Reduced server load**
- **Better error handling**
- **Enhanced debugging capabilities**

---

## **Success Criteria**

### **Performance Targets:**
- Initial page load < 2 seconds
- Map interactions < 100ms response time
- Bundle size < 500KB gzipped
- Memory usage < 100MB for typical usage

### **User Experience Targets:**
- Smooth 60fps animations
- No visible loading delays
- Responsive interactions
- Consistent performance across devices

### **Technical Targets:**
- Lighthouse score > 90
- Core Web Vitals in green
- No console errors
- Consistent performance metrics

---

## **Next Steps**

1. **Review this plan** and confirm priorities
2. **Set up performance monitoring** tools
3. **Create baseline measurements** before starting
4. **Begin with Phase 1** (Database optimization)
5. **Test and measure** after each phase
6. **Adjust timeline** based on actual progress

This optimization plan will transform your app's performance without the complexity of a full backend rewrite, delivering significant improvements in user experience and technical performance. 