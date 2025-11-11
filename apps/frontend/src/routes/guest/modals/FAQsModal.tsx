import React from "react";

interface FAQsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQsModal: React.FC<FAQsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const faqs = [
    {
      q: "What should I wear?",
      a: "Dress is cocktail attire — feel free to lean into desert chic and vibrant colors."
    },
    {
      q: "Is parking available?",
      a: "Yes, valet and limited on-site parking will be available. Rideshare is encouraged."
    },
    {
      q: "Can I bring a guest?",
      a: "Your invitation includes specific guest details. Please reach out if you have questions."
    },
    {
      q: "Will there be vegetarian or gluten-free options?",
      a: "Absolutely. Dietary preferences can be indicated in your RSVP response."
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          aria-label="Close FAQ modal"
        >
          ✕
        </button>
        <h2 className="text-2xl font-semibold mb-4 text-center">FAQs</h2>
        <div className="space-y-4">
          {faqs.map((item, i) => (
            <div key={i}>
              <p className="font-semibold text-gray-800">{item.q}</p>
              <p className="text-gray-700">{item.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-cactus-green text-white hover:bg-cactus-green/80 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQsModal;