import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, FlatList, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useDebounce } from "../../hooks/useDebounce";

interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  placeholder: string;
  onSelect: (location: Location) => void;
  value?: string;
}

interface MapboxFeature {
  id: string;
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    name: string;
    full_address?: string;
  };
}

const MAPBOX_URL = "https://api.mapbox.com/search/searchbox/v1/forward";
const COUNTRY = "au";
// Greater Melbourne bounding box and CBD proximity for strict localized routing
const PROXIMITY = "144.9631,-37.8136";
const BBOX = "144.3336,-38.5020,145.8642,-37.1750";

export const AddressAutocomplete = ({ placeholder, onSelect, value = "" }: AddressAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const isSelecting = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, 400); // Trigger slightly faster for perceived performance

  // Sync external value dynamically
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    // Prevent fetching if the change was triggered by a user selection or query is too short
    if (isSelecting.current) return;
    
    if (!debouncedQuery || debouncedQuery.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const fetchAddresses = async () => {
      setLoading(true);
      
      // Cancel previous pending request to prevent data race conditions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
          console.warn("Missing Mapbox token in environment variables.");
          return;
        }

        const url = `${MAPBOX_URL}?q=${encodeURIComponent(debouncedQuery)}&types=poi,address&country=${COUNTRY}&proximity=${PROXIMITY}&bbox=${BBOX}&access_token=${token}`;
        
        const response = await fetch(url, { signal: abortControllerRef.current.signal });
        const data = await response.json();
        
        if (data?.features?.length > 0) {
          setResults(data.features);
          setShowDropdown(true);
        } else {
          setResults([]);
        }
      } catch (error: any) {
        // Ignore AbortError caused by race condition cancellations
        if (error.name !== "AbortError") {
          console.error("Mapbox Geocoding Error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();

    // Cleanup function strictly for unmounting
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery]);

  const handleSelect = (feature: MapboxFeature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const name = feature.properties.full_address || feature.properties.name;
    
    isSelecting.current = true;
    setQuery(name);
    setShowDropdown(false);
    onSelect({ name, lat, lng });
  };

  const clearInput = () => {
    isSelecting.current = false;
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <View className="w-full relative justify-center mb-4" style={{ zIndex: 100, elevation: 5 }}>
      <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3 py-2 h-12">
        <TextInput
          className="flex-1 text-base text-gray-900"
          placeholder={placeholder}
          value={query}
          onChangeText={(text) => {
            isSelecting.current = false;
            setQuery(text);
            if (text.length >= 3) setShowDropdown(true);
          }}
          onFocus={() => {
            if (results.length > 0 && query.length >= 3) setShowDropdown(true);
          }}
        />
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={clearInput} className="px-2">
            <Text className="text-gray-400 text-lg font-bold">×</Text>
          </TouchableOpacity>
        )}
        {loading && <ActivityIndicator size="small" color="#4F46E5" className="ml-2" />}
      </View>

      {showDropdown && results.length > 0 && (
        <View 
          className="absolute left-0 right-0 max-h-60 bg-white border border-gray-200 rounded-lg shadow-lg"
          style={{ position: "absolute", top: 56, zIndex: 9999, elevation: 10 }}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="p-3 border-b border-gray-100 active:bg-gray-50"
                onPress={() => handleSelect(item)}
              >
                <Text className="text-base text-gray-800" numberOfLines={1}>
                  {item.properties.full_address || item.properties.name}
                </Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          />
        </View>
      )}
    </View>
  );
};
