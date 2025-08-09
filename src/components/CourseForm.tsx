import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCourses } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';
import { Course, Location } from '../utils/firebase';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CourseFormData {
  name: string;
  location: Location;
  holes: number;
  par: number;
  rating?: number;
  slope?: number;
  amenities?: string[];
}

const CourseForm: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId?: string }>();
  const { currentUser } = useAuth();
  const { 
    currentCourse, 
    loading, 
    error, 
    createNewCourse, 
    updateExistingCourse,
    fetchCourse 
  } = useCourses();
  
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    location: { address: '', lat: 0, lng: 0 },
    holes: 18,
    par: 72,
    amenities: [],
  });
  const [currentAmenity, setCurrentAmenity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Load course data if in edit mode
  useEffect(() => {
    if (isEdit && courseId) {
      if (currentCourse?.id === courseId) {
        setFormData({
          name: currentCourse.name,
          location: currentCourse.location || { address: '', lat: 0, lng: 0 },
          holes: currentCourse.holes,
          par: currentCourse.par,
          rating: currentCourse.rating,
          slope: currentCourse.slope,
          amenities: currentCourse.amenities || [],
        });
      } else {
        fetchCourse(courseId).then(course => {
          if (course) {
            setFormData({
              name: course.name,
              location: course.location || { address: '', lat: 0, lng: 0 },
              holes: course.holes,
              par: course.par,
              rating: course.rating,
              slope: course.slope,
              amenities: course.amenities || [],
            });
          }
        });
      }
    }
  }, [isEdit, courseId, currentCourse, fetchCourse]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'holes' || name === 'par' || name === 'rating' || name === 'slope' 
        ? value === '' ? undefined : Number(value)
        : value
    }));
  };

  const handleLocationSelect = (place: google.maps.places.PlaceResult) => {
    if (!place.geometry || !place.geometry.location) {
      setMapError('Could not find location. Please try again.');
      return;
    }

    const locationData = {
      address: place.formatted_address || '',
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    setFormData(prev => ({
      ...prev,
      location: locationData,
    }));
    setMapError(null);
  };

  const handleAmenityAdd = () => {
    if (currentAmenity.trim() && !formData.amenities?.includes(currentAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...(prev.amenities || []), currentAmenity.trim()]
      }));
      setCurrentAmenity('');
    }
  };

  const handleAmenityRemove = (amenityToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities?.filter(a => a !== amenityToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      console.error('User must be logged in');
      setMapError('You must be logged in to save a course');
      return;
    }

    // Basic validation
    if (!formData.name.trim()) {
      setMapError('Course name is required');
      return;
    }

    if (!formData.location?.address) {
      setMapError('Please select a location for the course');
      return;
    }

    if (!formData.holes) {
      setMapError('Please specify the number of holes');
      return;
    }

    if (!formData.par) {
      setMapError('Please specify the par for the course');
      return;
    }

    // Ensure location has all required fields
    const location = {
      address: formData.location.address || '',
      lat: formData.location.lat || 0,
      lng: formData.location.lng || 0
    };

    // Prepare course data with proper types
    const courseData = {
      ...formData,
      location,
      holes: Number(formData.holes),
      par: Number(formData.par),
      rating: formData.rating ? Number(formData.rating) : undefined,
      slope: formData.slope ? Number(formData.slope) : undefined,
      amenities: formData.amenities || []
    };

    console.log('Submitting course data:', courseData);

    setIsSubmitting(true);
    setMapError(null);

    try {
      if (isEdit && courseId) {
        console.log('Updating course with ID:', courseId);
        await updateExistingCourse(courseId, courseData);
        console.log('Course updated successfully');
      } else {
        console.log('Creating new course');
        const newCourseId = await createNewCourse(courseData);
        console.log('Course created with ID:', newCourseId);
      }
      navigate('/courses');
    } catch (err) {
      console.error('Error saving course:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save course. Please try again.';
      setMapError(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initAutocomplete = () => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps JavaScript API not loaded');
      return;
    }

    const input = document.getElementById('location') as HTMLInputElement;
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'us' },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      handleLocationSelect(place);
    });
  };

  const scriptLoaded = React.useRef(false);

  useEffect(() => {
    // Skip if script is already loaded or being loaded
    if (scriptLoaded.current) return;
    
    // Check if Google Maps is already available
    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    // Check if script is already in the document
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      existingScript.addEventListener('load', initAutocomplete);
      return () => {
        existingScript.removeEventListener('load', initAutocomplete);
      };
    }

    // Load the script if not already present
    const loadGoogleMaps = () => {
      const script = document.createElement('script');
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google Maps API key is not defined');
        setMapError('Google Maps API key is missing. Please check your configuration.');
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        scriptLoaded.current = true;
        initAutocomplete();
      };
      script.onerror = (error) => {
        console.error('Error loading Google Maps:', error);
        setMapError('Failed to load Google Maps. Please check your internet connection and API key.');
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();

    // Cleanup function
    return () => {
      // Remove any event listeners if the component unmounts
      const scripts = document.querySelectorAll('script[src*="maps.googleapis.com/maps/api/js"]');
      scripts.forEach(script => {
        script.removeEventListener('load', initAutocomplete);
      });
    };
  }, []);

  if (loading && isEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="md:col-span-1 mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {isEdit ? 'Edit Course' : 'Add New Course'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {isEdit 
              ? 'Update the course details below.' 
              : 'Fill in the details below to add a new golf course.'}
          </p>
        </div>

        {(error || mapError) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error || mapError}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-6">
                {/* Course Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Course Name *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., Pebble Beach Golf Links"
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      id="location"
                      name="location"
                      defaultValue={formData.location.address}
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search for a location"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  {formData.location.lat !== 0 && formData.location.lng !== 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: {formData.location.address}
                    </p>
                  )}
                </div>

                {/* Course Details */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="holes" className="block text-sm font-medium text-gray-700">
                      Number of Holes *
                    </label>
                    <select
                      id="holes"
                      name="holes"
                      value={formData.holes}
                      onChange={handleInputChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                      required
                    >
                      <option value={9}>9 Holes</option>
                      <option value={18}>18 Holes</option>
                      <option value={27}>27 Holes</option>
                      <option value={36}>36 Holes</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="par" className="block text-sm font-medium text-gray-700">
                      Par *
                    </label>
                    <input
                      type="number"
                      id="par"
                      name="par"
                      min="1"
                      max="200"
                      value={formData.par || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                      Course Rating
                    </label>
                    <input
                      type="number"
                      id="rating"
                      name="rating"
                      min="50"
                      max="100"
                      step="0.1"
                      value={formData.rating || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 72.5"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="slope" className="block text-sm font-medium text-gray-700">
                      Slope Rating
                    </label>
                    <input
                      type="number"
                      id="slope"
                      name="slope"
                      min="55"
                      max="155"
                      value={formData.slope || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 135"
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label htmlFor="amenities" className="block text-sm font-medium text-gray-700">
                    Amenities
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="amenity"
                      id="amenity"
                      value={currentAmenity}
                      onChange={(e) => setCurrentAmenity(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAmenityAdd())}
                      className="focus:ring-green-500 focus:border-green-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                      placeholder="e.g., Driving Range, Pro Shop"
                    />
                    <button
                      type="button"
                      onClick={handleAmenityAdd}
                      className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.amenities && formData.amenities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.amenities.map((amenity, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {amenity}
                          <button
                            type="button"
                            onClick={() => handleAmenityRemove(amenity)}
                            className="ml-1.5 inline-flex items-center justify-center flex-shrink-0 h-4 w-4 text-green-500 hover:text-green-700 focus:outline-none"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEdit ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
