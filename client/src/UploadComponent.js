import React, { useState } from 'react';
import axios from 'axios';

function UploadComponent() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [presignedUrl, setPresignedUrl] = useState('');
  const [jsonToComfy, setJsonToComfy] = useState(null); // Assuming you set this state somewhere in your component

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile.name);
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
        setFileUrl(result.fileUrl);
        fetchPresignedUrl(result.fileUrl.split('/').pop()); // Assuming the filename is at the end of the URL
      } else {
        setUploadStatus('Upload failed: ' + result.message);
      }
    } catch (error) {
      console.error('Error uploading the file:', error);
      setUploadStatus('Upload failed: ' + error.message);
    }
  };

  const fetchPresignedUrl = async (fileName) => {
    try {
      const response = await fetch(`/generate-presigned-url?fileName=${encodeURIComponent(fileName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch presigned URL');
      }

      const result = await response.json();
      if (result.success) {
        setPresignedUrl(result.presignedUrl);
        // Optionally, call sendJsonToComfyUI here after setting the presigned URL
        // const jsonToComfy = createJsonToComfy(result.presignedUrl);
        // sendJsonToComfyUI(jsonToComfy);
      } else {
        console.error('Failed to get presigned URL:', result.message);
      }
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
    }
  };

  const createJsonToComfy = (presignedUrl) => {

    return {
    // Modify this function to match your JSON structure
      "prompt": {
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
            "url": presignedUrl
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
      }
    };
  };

  const sendDataToComfy = async () => {
    const endpoint = "http://134.215.109.213:44363/prompt";
    try {
      const response = await axios.post(endpoint, { prompt: jsonToComfy });
      console.log('Response from Comfy:', response.data);
      alert('Data sent to Comfy successfully.');
    } catch (error) {
      console.error('BRUCE Error sending data to Comfy:', error);
      alert('Failed to send data to Comfy.');
      alert(error);
    }
  };

  /*
  const sendJsonToComfyUI = async (jsonToComfy) => {
    try {
//      const res = await axios.post('http://127.0.0.1:8188/prompt',{
//      	prompt:json_data_object	
//      });
      const comfyUIEndpoint = 'https://134.215.109.213:44319/prompt'; // Update with the actual endpoint
      await axios.post(comfyUIEndpoint, jsonToComfy, {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Bypass SSL certificate validation - use with caution
      });
      console.log('JSON sent to ComfyUI server successfully.');
    } catch (error) {
      console.error('Error sending JSON to ComfyUI:', error);
    }
  }; */

  const downloadJson = () => {
    // const jsonToDownload = { fileUrl, presignedUrl }; // Adjust this object as needed for your requirements

    const jsonToDownload = {
      // Your JSON structure
      // Use presignedResult.presignedUrl where necessary
      "prompt": {
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
            "url": presignedUrl
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
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonToDownload));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "comfy_ui_configuration.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {uploadStatus && <p>{uploadStatus}</p>}
      {presignedUrl && <>
      <button onClick={downloadJson}>Download JSON</button>
      <p><a href={presignedUrl} target="_blank" rel="noopener noreferrer">Access File Directly</a></p>
      <button onClick={sendDataToComfy}>Send to Comfy</button> {/* New button for sending data */}
      </>}
    </div>
  );
}

export default UploadComponent;