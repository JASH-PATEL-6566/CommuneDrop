"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Edit, Loader, User, Mail, Phone, MapPin, Camera } from "lucide-react";
import { userService } from "../../services/user-service";
import { DEFAULT_PROFILE_IMAGE } from "../../utils/tokenStorage";
import { motion } from "framer-motion";

interface PersonalInfoSectionProps {
  userData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    profileImage: string;
    savedLocations: Array<{
      id: number;
      name: string;
      address: string;
    }>;
  };
  onProfileUpdated?: () => void;
}

export default function PersonalInfoSection({
  userData,
  onProfileUpdated,
}: PersonalInfoSectionProps) {
  // Update the profileImage state initialization to use useMemo
  const [profileImage, setProfileImage] = useState(() => {
    // Only use the actual profile image if it exists and is not the default placeholder
    if (
      userData.profileImage &&
      !userData.profileImage.includes("placeholder.svg")
    ) {
      return userData.profileImage;
    }
    // Otherwise use our data URI
    return DEFAULT_PROFILE_IMAGE;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    address: userData.address,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  useEffect(() => {
    setFormData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
    });
    if (
      userData.profileImage &&
      !userData.profileImage.includes("placeholder.svg")
    ) {
      setProfileImage(userData.profileImage);
    } else {
      setProfileImage(DEFAULT_PROFILE_IMAGE);
    }
  }, [userData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.updateProfile({
        name: formData.name,
        phoneNumber: formData.phone,
        address: formData.address,
      });

      if (response.success) {
        setIsEditing(false);
        if (onProfileUpdated) {
          onProfileUpdated();
        }
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF, or WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const tempImageUrl = URL.createObjectURL(file);
      const processedFile = await processImage(file);
      setProfileImage(tempImageUrl);
      const response = await userService.uploadProfileImage(processedFile);
      if (response.success) {
        if (response.data.imageUrl) {
          URL.revokeObjectURL(tempImageUrl);
          setProfileImage(response.data.imageUrl);
          setSuccessMessage("Profile picture updated successfully!");
          setTimeout(() => setSuccessMessage(null), 3000);
          if (onProfileUpdated) {
            onProfileUpdated();
          }
        } else {
          console.warn(
            "No image URL returned from server, using local preview"
          );
        }
      } else {
        setError(response.message || "Failed to upload profile image");
        URL.revokeObjectURL(tempImageUrl);
        setProfileImage(userData.profileImage || DEFAULT_PROFILE_IMAGE);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      setProfileImage(userData.profileImage || DEFAULT_PROFILE_IMAGE);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const processImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          const size = Math.min(img.width, img.height);
          const outputSize = 300;
          canvas.width = outputSize;
          canvas.height = outputSize;
          const sourceX = (img.width - size) / 2;
          const sourceY = (img.height - size) / 2;
          ctx.beginPath();
          ctx.arc(
            outputSize / 2,
            outputSize / 2,
            outputSize / 2,
            0,
            Math.PI * 2
          );
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            size,
            size,
            0,
            0,
            outputSize,
            outputSize
          );
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Could not create image blob"));
                return;
              }
              const processedFile = new File([blob], "profile-picture.jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(processedFile);
            },
            "image/jpeg",
            0.9
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.crossOrigin = "anonymous";
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.src !== DEFAULT_PROFILE_IMAGE) {
      e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
    }
  };
  return (
    <div className="w-full font-sans">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}
      <h2 className="text-2xl font-semibold mb-6">Profile Picture</h2>
      <div className="border-t border-gray-200 mb-6"></div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8 overflow-hidden">
        <div className="p-6 flex items-center">
          <div
            className={`relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 mr-4 ${
              isEditing ? "cursor-pointer" : ""
            }`}
            onClick={handleProfileImageClick}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <Loader className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <img
              src={profileImage || "/placeholder.svg?height=150&width=150"}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={handleImageError}
              fetchPriority="high"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs font-medium">
                <Camera size={16} className="mr-1" />
                Change
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <p className="text-gray-900">Your profile picture</p>
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPEG, PNG, GIF, WEBP (max 5MB)
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Personal Information</h2>
        <button
          onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
          disabled={isLoading}
          className="flex items-center gap-2 text-primary font-medium hover:underline disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Edit size={16} />
              {isEditing ? "Save" : "Edit"}
            </>
          )}
        </button>
      </div>
      <div className="border-t border-gray-200 mb-6"></div>

      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: index * 0.08,
                mass: 0.7,
              }}
            >
              {index === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-blue-50">
                        <User className="w-5 h-5 text-blue-500" />
                      </div>
                      <label className="font-medium text-gray-900">
                        Full Name
                      </label>
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded font-normal mt-1"
                    />
                  </div>
                </div>
              )}
              {index === 1 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-green-50">
                        <Mail className="w-5 h-5 text-green-500" />
                      </div>
                      <label className="font-medium text-gray-900">Email</label>
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded font-normal bg-gray-100 mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                </div>
              )}
              {index === 2 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-purple-50">
                        <Phone className="w-5 h-5 text-purple-500" />
                      </div>
                      <label className="font-medium text-gray-900">
                        Phone Number
                      </label>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded font-normal mt-1"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              )}
              {index === 3 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-orange-50">
                        <MapPin className="w-5 h-5 text-orange-500" />
                      </div>
                      <label className="font-medium text-gray-900">
                        Address
                      </label>
                    </div>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded font-normal mt-1"
                      placeholder="Enter your address"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: index * 0.08,
                mass: 0.7,
              }}
              whileHover={{
                y: -3,
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
                transition: { type: "spring", stiffness: 400, damping: 15 },
              }}
            >
              {index === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-blue-50">
                        <User className="w-5 h-5 text-blue-500" />
                      </div>
                      <h3 className="font-medium text-gray-900">Full Name</h3>
                    </div>
                    <p className="text-gray-700 pl-10">{userData.name}</p>
                  </div>
                </div>
              )}
              {index === 1 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-green-50">
                        <Mail className="w-5 h-5 text-green-500" />
                      </div>
                      <h3 className="font-medium text-gray-900">Email</h3>
                    </div>
                    <p className="text-gray-700 pl-10">{userData.email}</p>
                  </div>
                </div>
              )}
              {index === 2 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-purple-50">
                        <Phone className="w-5 h-5 text-purple-500" />
                      </div>
                      <h3 className="font-medium text-gray-900">
                        Phone Number
                      </h3>
                    </div>
                    <p className="text-gray-700 pl-10">
                      {userData.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              )}
              {index === 3 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-orange-50">
                        <MapPin className="w-5 h-5 text-orange-500" />
                      </div>
                      <h3 className="font-medium text-gray-900">Address</h3>
                    </div>
                    <p className="text-gray-700 pl-10">
                      {userData.address || "Not provided"}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
