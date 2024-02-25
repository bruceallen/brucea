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

        const workflowJson =
        {
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

        // THE USER WANTS TO DOWNLOAD THIS - HOW DO I GIVE THEM A BUTTON TO DO SO?

      } else {
        setUploadStatus('Upload failed: ' + uploadResult.message);
      }
    } catch (error) {
      console.error('Error:', error);
      setUploadStatus('Upload failed: ' + error.message);
    }
  };

  const downloadJson = () => {
    const jsonData = {
      success: true,
      message: 'File uploaded successfully',
      fileUrl: fileUrl,
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "upload_data.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
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

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {uploadStatus && <p>{uploadStatus}</p>}
      {presignedUrl && <div>
        <p>Presigned URL for download:</p>
        <a href={presignedUrl} target="_blank" rel="noopener noreferrer">Download File</a>
      </div>}
      {uploadStatus && <p>{uploadStatus}</p>}
      {fileUrl && <button onClick={downloadJson}>Download JSON</button>}
    </div>
  );
}

export default UploadComponent;