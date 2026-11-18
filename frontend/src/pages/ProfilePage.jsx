import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Loading from "../components/Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/useLanguage.js";
import {
  deleteProfileImage,
  getCurrentUser,
  updateProfile,
  uploadProfileImage,
} from "../services/userService.js";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const translateInEffect = useEffectEvent(t);
  const [profile, setProfile] = useState(user);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState(false);
  const imageInputRef = useRef(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    mobile: "",
    address: "",
    email: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    getCurrentUser()
      .then((currentUser) => {
        if (isCurrent) {
          setProfile(currentUser);
        }
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(translateInEffect(requestError.message || "Could not load your profile."));
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  const aadhaar = profile?.aadharCardNumber;
  const maskedAadhaar = aadhaar
    ? `${"*".repeat(Math.max(0, String(aadhaar).length - 4))}${String(aadhaar).slice(-4)}`
    : t("Not available");

  function handleImageSelection(event) {
    const image = event.target.files?.[0];
    event.target.value = "";

    if (!image) {
      return;
    }

    if (!image.type.startsWith("image/")) {
      setUploadMessage(t("Please choose a valid image file."));
      setUploadError(true);
      return;
    }

    if (image.size > MAX_PROFILE_IMAGE_SIZE) {
      setUploadMessage(t("Image size must be 5 MB or less."));
      setUploadError(true);
      return;
    }

    setSelectedImage(image);
    setPreviewUrl(URL.createObjectURL(image));
    setIsEditingImage(true);
    setUploadMessage("");
    setUploadError(false);
  }

  function handleChangeImageClick() {
    setShowImageOptions(false);
    setUploadMessage("");
    setUploadError(false);
    imageInputRef.current?.click();
  }

  function handleCancelImageChange() {
    setSelectedImage(null);
    setPreviewUrl("");
    setUploadMessage("");
    setUploadError(false);
    setIsEditingImage(false);
  }

  function handleEditDetails() {
    setProfileForm({
      name: profile.name || "",
      mobile: profile.mobile || "",
      address: profile.address || "",
      email: profile.email || "",
    });
    setProfileMessage("");
    setProfileError(false);
    setIsEditingDetails(true);
  }

  function handleCancelDetails() {
    setIsEditingDetails(false);
    setProfileMessage("");
    setProfileError(false);
  }

  async function handleSaveDetails(event) {
    event.preventDefault();

    try {
      setIsSavingDetails(true);
      setProfileMessage("");
      setProfileError(false);
      const updatedProfile = await updateProfile(profileForm);

      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setIsEditingDetails(false);
      setProfileMessage(t("Profile details updated successfully."));
    } catch (requestError) {
      setProfileMessage(t(requestError.message || "Could not update your profile."));
      setProfileError(true);
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function handleDeleteImage() {
    try {
      setIsDeletingImage(true);
      setUploadMessage("");
      setUploadError(false);
      await deleteProfileImage();

      setProfile((currentProfile) => ({
        ...currentProfile,
        profileImage: null,
      }));
      updateUser({ profileImage: null });
      setIsDeleteDialogOpen(false);
      setShowImageOptions(false);
      setUploadMessage(t("Profile picture deleted successfully."));
    } catch (requestError) {
      setUploadMessage(t(requestError.message || "Image deletion failed."));
      setUploadError(true);
    } finally {
      setIsDeletingImage(false);
    }
  }

  async function handleImageUpload() {
    if (!selectedImage) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadMessage("");
      setUploadError(false);

      const data = await uploadProfileImage(selectedImage);

      if (!data?.profileImage?.url) {
        throw new Error(t("The server did not return the updated profile image."));
      }

      setProfile((currentProfile) => ({
        ...currentProfile,
        profileImage: data.profileImage,
      }));
      updateUser({ profileImage: data.profileImage });
      setSelectedImage(null);
      setPreviewUrl("");
      setIsEditingImage(false);
      setUploadMessage(t("Profile picture updated successfully."));
    } catch (requestError) {
      const message = t(requestError.message || "Image upload failed.");
      setUploadMessage(
        message.toLowerCase().includes("file too large")
          ? "Image size must be 5 MB or less."
          : message,
      );
      setUploadError(true);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="app-page mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          {t("Account")}
        </p>
        <h1 className="app-page-heading mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {t("My profile")}
        </h1>
      </header>

      {error && (
        <p
          aria-live="polite"
          className="status-message rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}

      {isLoading && !profile ? (
        <Loading message={t("Loading your profile...")} />
      ) : profile ? (
        <section className="app-surface p-6 sm:p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                {previewUrl || profile.profileImage?.url ? (
                  <img
                    src={previewUrl || profile.profileImage.url}
                    alt={
                      previewUrl
                        ? t("Preview of the new profile picture")
                        : t("Profile")
                    }
                    className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg ring-2 ring-indigo-200 sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-indigo-100 to-violet-200 text-3xl font-bold text-indigo-700 shadow-inner ring-2 ring-indigo-200 sm:h-24 sm:w-24">
                    {profile.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                {previewUrl && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
                    {t("Preview")}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-indigo-600">
                  {t("Account profile")}
                </p>
                <h2 className="mt-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">
                  {profile.name}
                </h2>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {profile.email || t("Your personal account details")}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {selectedImage ? (
                <button
                  aria-label={t("Save profile picture")}
                  className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                  disabled={isUploading}
                  onClick={handleImageUpload}
                  type="button"
                >
                  {isUploading ? t("Saving...") : t("Change")}
                </button>
              ) : showImageOptions ? (
                <>
                  <button
                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-100"
                    onClick={handleChangeImageClick}
                    type="button"
                  >
                    {t("Change")}
                  </button>
                  <button
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700 shadow-sm hover:border-red-300 hover:bg-red-100"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    type="button"
                  >
                    {t("Delete")}
                  </button>
                </>
              ) : (
                <button
                  aria-label={t("Edit profile picture")}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-100 sm:px-4"
                  onClick={() => setShowImageOptions(true)}
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                  </svg>
                  {t("Edit")}
                </button>
              )}
            </div>
          </div>

          <input
            ref={imageInputRef}
            accept="image/*"
            className="sr-only"
            id="profileImage"
            onChange={handleImageSelection}
            type="file"
          />

          {isEditingImage && (
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
              <p className="text-sm text-red-600">
                {selectedImage
                  ? t("Previewing your new picture. Select Change to save it.")
                  : t("Choose a clear image for your profile (5 MB max).")}
              </p>
              <button
                className="text-sm font-semibold text-red-600 underline decoration-red-300 underline-offset-4 hover:text-red-900 cursor-pointer rounded-lg px-3 py-2 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isUploading}
                onClick={handleCancelImageChange}
                type="button"
              >
                {t("Cancel")}
              </button>
            </div>
          )}

          {uploadMessage && (
            <p
              className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
                uploadError
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-green-200 bg-green-50 text-green-800"
              }`}
              role={uploadError ? "alert" : "status"}
            >
              {uploadMessage}
            </p>
          )}

          <div className="border-t border-slate-200 pt-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                {t("Account details")}
              </h3>
              {!isEditingDetails && (
                <button
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  onClick={handleEditDetails}
                  type="button"
                >
                  {t("Edit details")}
                </button>
              )}
            </div>

            {isEditingDetails ? (
              <form className="space-y-5" onSubmit={handleSaveDetails}>
                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <label className="block text-sm text-slate-600">
                    {t("Name")}
                    <input
                      autoComplete="name"
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      required
                      value={profileForm.name}
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    {t("Mobile number")}
                    <input
                      autoComplete="tel"
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          mobile: event.target.value,
                        }))
                      }
                      type="tel"
                      value={profileForm.mobile}
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    {t("Email")}
                    <input
                      autoComplete="email"
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      type="email"
                      value={profileForm.email}
                    />
                  </label>
                  <label className="block text-sm text-slate-600 sm:col-span-2">
                    {t("Address")}
                    <textarea
                      autoComplete="street-address"
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      required
                      rows={3}
                      value={profileForm.address}
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    disabled={isSavingDetails}
                    onClick={handleCancelDetails}
                    type="button"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSavingDetails}
                    type="submit"
                  >
                    {isSavingDetails ? t("Saving...") : t("Save changes")}
                  </button>
                </div>
              </form>
            ) : (
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-slate-500">{t("Name")}</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {profile.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">{t("Role")}</dt>
                  <dd className="mt-1 font-medium capitalize text-slate-900">
                    {t(profile.role)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">{t("Age")}</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {profile.age ?? t("Not available")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">
                    {t("Aadhar card number")}
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {maskedAadhaar}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">{t("Email")}</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {profile.email || t("Not provided")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">{t("Mobile")}</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {profile.mobile || t("Not provided")}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-slate-500">{t("Address")}</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {profile.address || t("Not provided")}
                  </dd>
                </div>
                {profile.role === "voter" && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm text-slate-500">{t("Voting status")}</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {t(profile.isVoted ? "Vote recorded" : "Not voted yet")}
                    </dd>
                  </div>
                )}
              </dl>
            )}
            {profileMessage && (
              <p
                className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${
                  profileError
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-green-200 bg-green-50 text-green-800"
                }`}
                role={profileError ? "alert" : "status"}
              >
                {profileMessage}
              </p>
            )}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <Link
              className="font-semibold text-indigo-700 hover:underline *:focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white  rounded-lg px-3 py-2 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 text-sm"
              to="/change-password"
            >
              {t("Change password")}
            </Link>
          </div>
        </section>
      ) : (
        !isLoading && (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
            {t("Profile details are unavailable.")}
          </p>
        )
      )}
      <ConfirmDialog
        cancelText={t("Cancel")}
        confirmingText={t("Deleting...")}
        confirmText={t("Delete")}
        isConfirming={isDeletingImage}
        isOpen={isDeleteDialogOpen}
        message={t("Are you sure you want to delete your profile picture? This cannot be undone.")}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setShowImageOptions(false);
        }}
        onConfirm={handleDeleteImage}
        title={t("Delete profile picture?")}
      />
    </main>
  );
}

export default ProfilePage;
