"use client";

import React, { useState } from "react";

interface BiometricRecord {
  employeeId: string;
  // full timestamp like "2025-09-23 16:54:56"
  timestamp: string;
  // any remaining columns from the raw file (keeps parser flexible)
  extras: string[];
}

const HomePage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [convertedData, setConvertedData] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const parseRawData = (content: string): BiometricRecord[] => {
    const lines = content.trim().split("\n");
    const records: BiometricRecord[] = [];

    lines.forEach((line) => {
      if (!line.trim()) return;

      const parts = line.split("\t").map((p) => p.trim());

      // Expected biometric format (observed in the provided file):
      // [0] employeeId
      // [1] "YYYY-MM-DD HH:MM:SS" (single token with space)
      // [2+] other numeric flags
      // We'll be flexible: accept lines with at least 2 columns and keep the rest in extras
      if (parts.length >= 2) {
        const employeeId = parts[0];
        const timestamp = parts[1];
        const extras = parts.slice(2);

        records.push({ employeeId, timestamp, extras });
      }
    });

    return records;
  };

  const convertToAUBFormat = (records: BiometricRecord[]): string => {
    // New mapping based on your requested output samples:
    // - col3 is always '1'
    // - col5 is always '1'
    // - col6 is always '0'
    // - col4 encodes Clock In/Out derived from the timestamp hour:
    //     0 => Clock IN (morning), 1 => Clock OUT (afternoon/evening)
    // This matches examples like:
    // 72 2025-11-03 08:52:08 -> 1 0 1 0  (morning -> IN -> col4=0)
    // 72 2025-11-03 18:18:47 -> 1 1 1 0  (evening -> OUT -> col4=1)

    const lines: string[] = [];

    records.forEach((record) => {
      const col3 = "1";
      const col5 = "1";
      const col6 = "0";

      // First, prefer using an explicit I/O token from the raw extras if present.
      // Historically the raw file used parts[6] for log type (I/O). Since
      // `extras` starts at parts[2], that token is at extras[4]. If present,
      // map I -> 1, O -> 0.
      let col4 = "0";
      const maybeLogType = (record.extras?.[4] ?? "").toString().trim().toUpperCase();
      if (maybeLogType === "I") {
        col4 = "1"; // I => IN => 1
      } else if (maybeLogType === "O") {
        col4 = "0"; // O => OUT => 0
      } else {
        // Fallback: derive IN/OUT from timestamp hour (morning => IN(0), afternoon/evening => OUT(1))
        try {
          const timePart = record.timestamp.split(" ")[1] ?? "00:00:00";
          const hour = parseInt(timePart.split(":")[0], 10);
          if (!Number.isNaN(hour) && hour >= 12) {
            col4 = "1";
          } else {
            col4 = "0";
          }
        } catch (e) {
          col4 = "0";
        }
      }

      const aubLine = `${record.employeeId}\t${record.timestamp}\t${col3}\t${col4}\t${col5}\t${col6}`;
      lines.push(aubLine);
    });

    return lines.join("\n");
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
        timestamp: records[0]?.timestamp,
        extras: records[0]?.extras,
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
