import Feedback from "../../../components/feedback";


export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}

      {/* Floating Feedback Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Feedback />
      </div>
    </div>
  );
}
