import React, { useState } from 'react';

function UploadComponent() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile.name); // Set the file name when the file is selected
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
        setFileUrl(result.fileUrl); // Assuming result.fileUrl is the direct S3 URL
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
      // Use the state fileName for generating presigned URL
      const presignedResponse = await fetch(`/generate-presigned-url?fileName=${encodeURIComponent(fileName)}`);
      if (!presignedResponse.ok) {
        throw new Error('Failed to fetch presigned URL');
      }

      const presignedResult = await presignedResponse.json();
      if (presignedResult.success) {
        const jsonToComfy = {
          // Your JSON structure
          // Use presignedResult.presignedUrl where necessary
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

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonToComfy));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "comfy_ui_configuration.json");
        document.body.appendChild(downloadAnchorNode);
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
