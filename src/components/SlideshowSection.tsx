import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface SlideshowImage {
  id: string;
  image_url: string;
  title: string;
  description: string | null;
  display_order: number;
}

const SlideshowSection = () => {
  const [images, setImages] = useState<SlideshowImage[]>([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("slideshow_images")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      setImages(data);
    }
  };

  if (images.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-4">
            Our Impact
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how we're making a difference in our community
          </p>
        </div>

        <Carousel
          className="w-full max-w-5xl mx-auto"
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {images.map((image) => (
              <CarouselItem key={image.id}>
                <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
                    <div className="p-8 text-white">
                      <h3 className="text-3xl md:text-4xl font-heading font-bold mb-2">
                        {image.title}
                      </h3>
                      {image.description && (
                        <p className="text-lg md:text-xl text-white/90">
                          {image.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </div>
    </section>
  );
};

export default SlideshowSection;