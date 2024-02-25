import React, { useState } from 'react';

function UploadComponent() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5001/upload', {
        method: 'POST',
        body: formData,
        // Ensure headers are set if your backend expects them
        // headers: {
        //   'Accept': 'application/json',
        // },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Attempt to parse the response as JSON
      try {
        const result = await response.json();
        if (result.success) {
          setUploadStatus('File uploaded successfully: ' + result.fileUrl);
// LOCAL          setUploadStatus('File uploaded successfully: ' + result.filePath);

        } else {
          setUploadStatus('Upload failed: ' + result.message);
        }
      } catch (jsonParseError) {
        console.error('Error parsing response as JSON:', jsonParseError);
        setUploadStatus('Upload failed: Response was not valid JSON');
      }
    } catch (networkError) {
      console.error('Error uploading the file:', networkError);
      setUploadStatus('Upload failed: ' + networkError.message);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
}

export default UploadComponent;
