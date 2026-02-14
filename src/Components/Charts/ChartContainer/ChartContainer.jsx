import React, { Suspense, useState, useEffect } from 'react';
import './ChartContainer.css';
import { supabase } from '../../../lib/supabase';

// Lazy load chart components for code splitting
const EmotionDistributionChart = React.lazy(() => import('../Charts/EmotionDistributionChart'));
const EmotionMuiDonutChart = React.lazy(() => import('../Charts/EmotionMuiDonutChart'));
const EmotionTimeOfDayStackedChart = React.lazy(() => import('../Charts/EmotionTimeOfDayStackedChart'));
const EmotionWeekdayHeatmap = React.lazy(() => import('../Charts/EmotionWeekdayHeatmap'));

const ChartContainer = ({ markers: fallbackMarkers }) => {
  const [chartMarkers, setChartMarkers] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all markers for charts (no batch limit - gets ALL data)
  useEffect(() => {
    const fetchAllMarkersForCharts = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id ?? null;
        const BATCH_SIZE = 1000;
        let allChartMarkers = [];
        let batch = 0;
        let hasMore = true;
        
        console.log('Fetching all markers for charts (no limit)...');
        
        while (hasMore) {
          const from = batch * BATCH_SIZE;
          const to = from + BATCH_SIZE - 1;
          
          const { data, error } = await supabase
            .from('markers')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to);

          if (error) {
            console.error(`Error fetching chart data batch ${batch + 1}:`, error);
            break;
          }

          if (data && data.length > 0) {
            allChartMarkers = allChartMarkers.concat(data);
            console.log(`Chart data batch ${batch + 1}: Fetched ${data.length} markers (Total: ${allChartMarkers.length})`);
            
            // If we got less than BATCH_SIZE, we've reached the end
            if (data.length < BATCH_SIZE) {
              hasMore = false;
            } else {
              batch++;
            }
          } else {
            hasMore = false;
          }
        }

        if (allChartMarkers.length > 0) {
          const chartMarkersWithUserInfo = allChartMarkers.map(marker => ({
            ...marker,
            userTimestamp: new Date(marker.user_timestamp),
            isUserCandle: Boolean(currentUserId && marker.user_id === currentUserId)
          }));
          setChartMarkers(chartMarkersWithUserInfo);
          console.log(`Total chart markers loaded: ${chartMarkersWithUserInfo.length}`);
        } else {
          setChartMarkers([]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching chart markers:', error);
        setIsLoading(false);
        // Fall back to provided markers if available
        if (fallbackMarkers) {
          setChartMarkers(fallbackMarkers);
        }
      }
    };
    
    fetchAllMarkersForCharts();
  }, [fallbackMarkers]);

  // Use chartMarkers if available, otherwise fall back to provided markers
  const markersToUse = chartMarkers !== null ? chartMarkers : fallbackMarkers;

  if (isLoading && !markersToUse) {
    return <div className="chart-loading">Loading data...</div>;
  }

  if (!markersToUse || markersToUse.length === 0) {
    return <div className="chart-loading">No data available</div>;
  }

  return (
    <div className="chart-container">
      <Suspense fallback={<div className="chart-loading">Loading charts...</div>}>
        <EmotionDistributionChart data={markersToUse} />
        <EmotionMuiDonutChart markers={markersToUse} />
        <EmotionTimeOfDayStackedChart markers={markersToUse} />
        <EmotionWeekdayHeatmap markers={markersToUse} />
      </Suspense>
    </div>
  );
};

export default ChartContainer; 