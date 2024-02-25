import React, { useState } from 'react';

function UploadComponent() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');

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
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      if (result.success) {
        setUploadStatus('File uploaded successfully.');
        setFileUrl(result.fileUrl); // Assuming result.fileUrl contains the S3 URL
        setFileName(file.name); // Assuming you want to use the original file name for the presigned URL
      } else {
        setUploadStatus('Upload failed: ' + result.message);
      }
    } catch (error) {
      console.error('Error uploading the file:', error);
      setUploadStatus('Upload failed: ' + error.message);
    }
  };

  const downloadJson = async () => {
    try {
      const presignedResponse = await fetch(`/generate-presigned-url?fileName=${fileName}`);
      if (!presignedResponse.ok) {
        throw new Error('Failed to fetch presigned URL');
      }
      const presignedResult = await presignedResponse.json();
      if (presignedResult.success) {
        const jsonData = {
          success: true,
          message: 'File uploaded successfully',
          presignedUrl: presignedResult.presignedUrl, // Use the presigned URL here
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "upload_data.json");
        document.body.appendChild(downloadAnchorNode); // Required for Firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } else {
        console.error('Failed to get presigned URL:', presignedResult.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {uploadStatus && <p>{uploadStatus}</p>}
      {fileUrl && <button onClick={downloadJson}>Download JSON</button>}
    </div>
  );
}

export default UploadComponent;


/*
import React, { useState } from 'react';

function UploadComponent() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [fileUrl, setFileUrl] = useState('');

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
    
    // Update this URL to match your upload endpoint
    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setUploadStatus('File uploaded successfully.');
        setFileUrl(result.fileUrl); // Update state with the S3 file URL
      } else {
        setUploadStatus('Upload failed: ' + result.message);
      }
    } catch (error) {
      console.error('Error uploading the file:', error);
      setUploadStatus('Upload failed: ' + error.message);
    }


    
  };

  const downloadJson = () => {
    const jsonData = {
      "9": {
        "inputs": {
          "filename_prefix": "ComfyUI",
          "images": [
            "15",
            0
          ]
        },
        "class_type": "SaveImage",
        "_meta": {
          "title": "SAVE IT"
        }
      },
      "10": {
        "inputs": {
          "url": presignedResult.presignedUrl
        },
        "class_type": "LoadImageByUrl //Browser",
        "_meta": {
          "title": "USER IMAGE"
        }
      },
      "15": {
        "inputs": {
          "blur_radius": 10,
          "sigma": 1,
          "image": [
            "10",
            0
          ]
        },
        "class_type": "Blur",
        "_meta": {
          "title": "BLUR IT"
        }
      }
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "upload_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {uploadStatus && <p>{uploadStatus}</p>}
      {fileUrl && <button onClick={downloadJson}>Download JSON</button>}
    </div>
  );
}

export default UploadComponent;

*/