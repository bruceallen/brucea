import React, { useState } from 'react';

function UploadComponent() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [presignedUrl, setPresignedUrl] = useState('');

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
      const uploadResponse = await fetch('/upload', { // Make sure to use the correct endpoint
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Network response was not ok');
      }

      const uploadResult = await uploadResponse.json();
      if (uploadResult.success) {
 //       setUploadStatus(`File uploaded successfully: ${uploadResult.fileUrl}`);
// LOCAL          setUploadStatus('File uploaded successfully: ' + result.filePath);
        // Assuming the filename is part of the uploadResult
        const fileName = uploadResult.fileUrl.split('/').pop(); // Extract the filename from the URL
        const presignedResponse = await fetch(`/generate-presigned-url?fileName=${fileName}`);

        if (!presignedResponse.ok) {
          throw new Error('Failed to fetch presigned URL');
        }

        const presignedResult = await presignedResponse.json();
        if (presignedResult.success) {
          setPresignedUrl(presignedResult.presignedUrl);
        } else {
          console.error('Failed to get presigned URL:', presignedResult.message);
        }

        setUploadStatus(`File uploaded successfully: ${uploadResult.fileUrl} and presigned URL is ${presignedResult.presignedUrl}`);

      } else {
        setUploadStatus('Upload failed: ' + uploadResult.message);
      }
    } catch (error) {
      console.error('Error:', error);
      setUploadStatus('Upload failed: ' + error.message);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {uploadStatus && <p>{uploadStatus}</p>}
      {presignedUrl && <div>
        <p>Presigned URL for download:</p>
        <a href={presignedUrl} target="_blank" rel="noopener noreferrer">Download File</a>
      </div>}
    </div>
  );
}

export default UploadComponent;


/*
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
*/