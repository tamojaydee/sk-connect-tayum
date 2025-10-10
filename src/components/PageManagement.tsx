import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackgroundImageManager } from "./admin/BackgroundImageManager";
import { AnnouncementManager } from "./admin/AnnouncementManager";
import { SlideshowManager } from "./admin/SlideshowManager";

const PageManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-bold text-foreground">Page Management</h2>
        <p className="text-muted-foreground mt-2">Manage homepage content and appearance</p>
      </div>

      <Tabs defaultValue="background" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="background">Background</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="slideshow">Slideshow</TabsTrigger>
        </TabsList>

        <TabsContent value="background">
          <Card>
            <CardHeader>
              <CardTitle>Hero Background Image</CardTitle>
              <CardDescription>Upload or change the main page hero background image</CardDescription>
            </CardHeader>
            <CardContent>
              <BackgroundImageManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Manage announcements displayed below the hero section</CardDescription>
            </CardHeader>
            <CardContent>
              <AnnouncementManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slideshow">
          <Card>
            <CardHeader>
              <CardTitle>Image Slideshow</CardTitle>
              <CardDescription>Manage slideshow images with text overlays</CardDescription>
            </CardHeader>
            <CardContent>
              <SlideshowManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PageManagement;