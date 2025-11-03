import { Link } from "react-router";
import { DottedBackground } from "~/components/ui/dotted-background";

export default function Home() {
  return (
    <div className="relative w-full h-screen -mt-16 flex items-center justify-center">
      <DottedBackground />
      <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
        <img
          src="/logo.png"
          alt="ThirdEye Logo"
          className="h-20 object-contain mx-auto mb-6"
        />

        <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-4">
          ThirdEye
        </h1>

        <p className="text-xl sm:text-2xl text-muted-foreground mb-8">
          See It. Report It.{" "}
          <span className="text-accent font-semibold uppercase">
            Enforce It.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/report"
            className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Report Now
          </Link>
          <a
            href="#learn-more"
            className="px-8 py-3 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
}
