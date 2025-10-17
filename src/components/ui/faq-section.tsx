/**
 * FAQ Section Component
 * Accordion-style FAQ display with smooth animations
 */

"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

export const FAQSection = ({ faqs }: { faqs: FAQ[] }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className="w-full space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border-b border-gray-200 pb-4 cursor-pointer"
          onClick={() => setOpenIndex(openIndex === index ? null : index)}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 pr-4">
              {faq.question}
            </h3>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform duration-300 flex-shrink-0 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </div>
          <p
            className={`text-sm text-gray-600 transition-all duration-300 ease-in-out overflow-hidden ${
              openIndex === index
                ? "opacity-100 max-h-[500px] mt-4"
                : "opacity-0 max-h-0"
            }`}
          >
            {faq.answer}
          </p>
        </div>
      ))}
    </div>
  );
};

export const FAQSectionGradient = ({ faqs }: { faqs: FAQ[] }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className="w-full space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="flex flex-col items-start w-full">
          <div
            className="flex items-center justify-between w-full cursor-pointer bg-gradient-to-r from-blue-50 to-white border border-blue-100 p-4 rounded-lg hover:shadow-md transition-shadow"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <h2 className="text-sm font-semibold text-gray-900 pr-4">
              {faq.question}
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform duration-300 flex-shrink-0 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </div>
          <p
            className={`text-sm text-gray-600 px-4 transition-all duration-300 ease-in-out ${
              openIndex === index
                ? "opacity-100 max-h-[500px] translate-y-0 pt-4"
                : "opacity-0 max-h-0 -translate-y-2"
            }`}
          >
            {faq.answer}
          </p>
        </div>
      ))}
    </div>
  );
};
