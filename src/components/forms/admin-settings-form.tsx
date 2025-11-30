"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name must not exceed 150 characters"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(1, "Contact number is required").max(50),
});

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

interface AdminSettingsFormProps {
  initialData: {
    fullName: string;
    email: string;
    contactNumber: string | null;
    profileImage: string | null;
  };
}

export function AdminSettingsForm({ initialData }: AdminSettingsFormProps) {
  const router = useRouter();
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [profileImage, setProfileImage] = React.useState<string | null>(initialData.profileImage);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const profileForm = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: initialData.fullName,
      email: initialData.email,
      contactNumber: initialData.contactNumber || "",
    },
  });

  const passwordForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    setIsUploadingImage(true);
    setProfileError(null);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch("/api/upload/profile-picture", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({
          message: "Failed to upload profile picture.",
        }));
        setProfileError(errorBody.message ?? "Failed to upload profile picture.");
        setIsUploadingImage(false);
        return;
      }

      const result = await response.json();
      setProfileImage(result.url);
      setImageFile(null);
      setImagePreview(null);
      router.refresh();
    } catch (error) {
      setProfileError("Network error while uploading. Please retry.");
      setIsUploadingImage(false);
    }
  };

  const onProfileSubmit = async (values: ProfileUpdateValues) => {
    setProfileError(null);
    setIsUpdatingProfile(true);

    try {
      const response = await fetch("/api/library/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({
          message: "Failed to update profile. Please try again.",
        }));
        setProfileError(errorBody.message ?? "Failed to update profile. Please try again.");
        setIsUpdatingProfile(false);
        return;
      }

      setIsUpdatingProfile(false);
      router.refresh();
    } catch (error) {
      setProfileError("Network error while updating. Please retry.");
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordChangeValues) => {
    setPasswordError(null);
    setIsChangingPassword(true);

    try {
      const response = await fetch("/api/library/admin/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({
          message: "Failed to change password. Please try again.",
        }));
        setPasswordError(errorBody.message ?? "Failed to change password. Please try again.");
        setIsChangingPassword(false);
        return;
      }

      setIsChangingPassword(false);
      passwordForm.reset();
      router.refresh();
    } catch (error) {
      setPasswordError("Network error while changing password. Please retry.");
      setIsChangingPassword(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="picture">Profile Picture</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4">
        <Form {...profileForm}>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            <FormField
              control={profileForm.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isUpdatingProfile} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={profileForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={isUpdatingProfile} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={profileForm.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" disabled={isUpdatingProfile} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {profileError && (
              <p className="rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                {profileError}
              </p>
            )}

            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="password" className="space-y-4">
        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="current-password"
                      disabled={isChangingPassword}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      disabled={isChangingPassword}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      disabled={isChangingPassword}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {passwordError && (
              <p className="rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                {passwordError}
              </p>
            )}

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="picture" className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-32 w-32">
            {profileImage ? (
              <AvatarImage src={profileImage} alt="Profile" />
            ) : null}
            <AvatarFallback className="text-2xl">
              {getInitials(initialData.fullName)}
            </AvatarFallback>
          </Avatar>

          {imagePreview && (
            <div className="relative">
              <Image
                src={imagePreview}
                alt="Preview"
                width={128}
                height={128}
                className="rounded-full"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex flex-col items-center gap-2 w-full max-w-sm">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isUploadingImage}
              className="cursor-pointer"
            />
            {imageFile && (
              <Button
                onClick={handleImageUpload}
                disabled={isUploadingImage}
                className="w-full"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Picture
                  </>
                )}
              </Button>
            )}
          </div>

          {profileError && (
            <p className="rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive w-full max-w-sm">
              {profileError}
            </p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

