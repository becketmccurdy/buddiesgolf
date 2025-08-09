import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCourses } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  MapPinIcon, 
  PencilIcon, 
  ArrowLeftIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  PhoneIcon, 
  GlobeAltIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentCourse, loading, error, removeCourse, fetchCourse } = useCourses();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId).catch(console.error);
    }
  }, [courseId, fetchCourse]);

  useEffect(() => {
    // Load Google Maps API if we have a course with location
    if (currentCourse?.location?.lat && currentCourse?.location?.lng) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.onload = () => {
        initMap();
        setIsMapLoaded(true);
      };
      script.onerror = () => {
        console.error('Error loading Google Maps API');
        setMapError('Error loading map. Please refresh the page and try again.');
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [currentCourse]);

  const initMap = () => {
    if (!currentCourse?.location?.lat || !currentCourse?.location?.lng) return;

    try {
      const map = new window.google.maps.Map(
        document.getElementById('map') as HTMLElement,
        {
          center: { 
            lat: currentCourse.location.lat, 
            lng: currentCourse.location.lng 
          },
          zoom: 15,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }
      );

      new window.google.maps.Marker({
        position: { 
          lat: currentCourse.location.lat, 
          lng: currentCourse.location.lng 
        },
        map,
        title: currentCourse.name,
      });
    } catch (err) {
      console.error('Error initializing map:', err);
      setMapError('Failed to load map. Please try again later.');
    }
  };

  const handleDelete = async () => {
    if (!courseId) return;
    
    try {
      await removeCourse(courseId);
      navigate('/courses');
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  const handleStartRound = () => {
    navigate(`/rounds/new?courseId=${courseId}`);
  };

  if (loading && !currentCourse) {
    return <LoadingSpinner />;
  }

  if (!currentCourse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Course not found</h3>
          <p className="mt-2 text-sm text-gray-500">The requested course could not be found.</p>
          <div className="mt-6">
            <Link
              to="/courses"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                  <li>
                    <div>
                      <Link to="/courses" className="text-gray-500 hover:text-gray-700">
                        Courses
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-4 text-sm font-medium text-gray-500">
                        {currentCourse.name}
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                {currentCourse.name}
              </h1>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate(`/courses/edit/${courseId}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PencilIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleStartRound}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Start Round
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
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

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left column - Map */}
              <div className="lg:col-span-2">
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                  {currentCourse.location?.lat && currentCourse.location?.lng ? (
                    <div id="map" className="h-64 w-full"></div>
                  ) : (
                    <div className="h-64 w-full bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500">No location data available</p>
                    </div>
                  )}
                </div>

                {/* Course Details */}
                <div className="mt-6">
                  <h2 className="text-lg font-medium text-gray-900">Course Details</h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <MapPinIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">Location</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {currentCourse.location?.address || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-medium">{currentCourse.holes}</span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">Holes</h3>
                        <p className="mt-1 text-sm text-gray-900">{currentCourse.holes} Holes</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-medium">{currentCourse.par}</span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">Par</h3>
                        <p className="mt-1 text-sm text-gray-900">Par {currentCourse.par}</p>
                      </div>
                    </div>

                    {currentCourse.rating && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <StarIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-500">Course Rating</h3>
                          <p className="mt-1 text-sm text-gray-900">{currentCourse.rating}</p>
                        </div>
                      </div>
                    )}

                    {currentCourse.slope && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 font-medium">{currentCourse.slope}</span>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-500">Slope Rating</h3>
                          <p className="mt-1 text-sm text-gray-900">{currentCourse.slope}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column - Amenities and Actions */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                  
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleStartRound}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Start New Round
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => navigate(`/courses/edit/${courseId}`)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <PencilIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                      Edit Course
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete Course
                    </button>
                  </div>

                  {/* Amenities */}
                  {currentCourse.amenities && currentCourse.amenities.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentCourse.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
                        <span>Phone: {currentCourse.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <GlobeAltIcon className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
                        <a 
                          href={currentCourse.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 hover:underline"
                        >
                          {currentCourse.website || 'Website not provided'}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete {currentCourse.name}?
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this course? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;
