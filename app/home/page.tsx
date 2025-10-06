"use client";

import React, { useState } from "react";

interface BiometricRecord {
  employeeId: string;
  date: string;
  time: string;
  dummy1: string;
  dummy2: string;
  employeeName: string;
  logType: string;
  dummy3: string;
  dummy4: string;
}

const HomePage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [convertedData, setConvertedData] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const parseRawData = (content: string): BiometricRecord[] => {
    const lines = content.trim().split("\n");
    const records: BiometricRecord[] = [];

    lines.forEach((line) => {
      if (line.trim()) {
        const parts = line.split("\t");
        if (parts.length >= 8) {
          records.push({
            employeeId: parts[0].trim(),
            date: parts[1].trim(),
            time: parts[2].trim(),
            dummy1: parts[3].trim(), // 104
            dummy2: parts[4].trim(), // 15
            employeeName: parts[5].trim(), // Employee name
            logType: parts[6].trim(), // I or O
            dummy3: parts[7].trim(), // 0
            dummy4: parts[8] ? parts[8].trim() : "", // 1
          });
        }
      }
    });

    return records;
  };

  const convertToAUBFormat = (records: BiometricRecord[]): string => {
    let output = "";

    // Convert each record to AUB format - clean tab-separated format like the raw file
    records.forEach((record) => {
      // Format: Employee ID, Date, Time, Dummy(1), Log Type, Dummy(1), Dummy(0)
      // Convert I/O to 0/1 for AUB format (I=0, O=1)
      const logTypeValue = record.logType === "I" ? "0" : "1";
      // Make sure we're not including the 104 value - use hardcoded 1 instead
      const aubLine = `${record.employeeId}\t${record.date}\t1\t0\t1\t0`;
      output += `${aubLine}\n`;
    });

    return output.trim(); // Remove trailing newline
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setIsProcessing(true);

    try {
      const content = await file.text();
      console.log("Raw file content:", content);

      const records = parseRawData(content);
      console.log("Parsed records:", records);
      console.log("First record details:", {
        employeeId: records[0]?.employeeId,
        date: records[0]?.date,
        time: records[0]?.time,
        logType: records[0]?.logType,
      });

      const aubFormat = convertToAUBFormat(records);
      console.log("Converted AUB format:", aubFormat);

      setConvertedData(aubFormat);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = () => {
    if (!convertedData) {
      alert("No converted data to download");
      return;
    }

    const blob = new Blob([convertedData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted_aub_format.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          HRIS Biometric Data Converter
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Upload Raw Biometric Data
          </h2>

          <div className="mb-4">
            <label
              htmlFor="file-upload"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select your raw biometric data file:
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!file || isProcessing}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? "Processing..." : "Convert to AUB Format"}
          </button>
        </div>

        {convertedData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Converted AUB Format</h2>
              <button
                onClick={downloadFile}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Download File
              </button>
            </div>

            <div className="bg-gray-100 rounded-md p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {convertedData}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Instructions:
          </h3>
          <ul className="text-blue-800 space-y-1">
            <li>
              • Upload your raw biometric data file (tab-separated format)
            </li>
            <li>• Click "Convert to AUB Format" to process the data</li>
            <li>
              • The converter will transform your data to match the AUB format
              requirements
            </li>
            <li>• Download the converted file when ready</li>
            <li>• Check the browser console for detailed processing logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
