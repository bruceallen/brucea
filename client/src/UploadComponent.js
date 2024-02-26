// BRUCE UPLOADCOMPONENT.JS - 2024.02.25 - works to send to ComfyUI YAAY
// now gonna work on getting stuff back!

import React, { useState } from 'react';
import axios from 'axios';

function UploadComponent() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [presignedUrl, setPresignedUrl] = useState('');
  const [jsonToComfy, setJsonToComfy] = useState(null); // Assuming you set this state somewhere in your component

  const [imageUrl, setImageUrl] = useState('');

  // State for storing the response from Comfy
  const [comfyResponse, setComfyResponse] = useState(null);

  // State for storing the output filename
  const [outputFilename, setOutputFilename] = useState('');

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

  // Function to fetch history using prompt_id and display the output filename
  const fetchHistoryAndDisplayFilename = async (promptId) => {
    try {
      const response = await axios.get(`/proxy-history/${promptId}`);
      // Alerting the response data for debugging
      // alert(JSON.stringify(response.data, null, 2));
  
      // The history data seems to be keyed by the promptId, so we access it accordingly
      const historyData = response.data[promptId];
  
      // Now we can attempt to find the outputs within this specific history data
      const outputs = historyData && historyData.outputs ? historyData.outputs : null;
  
      let filename = '';
      if (outputs) {
        for (const key in outputs) {
          if (outputs[key].images && outputs[key].images.length > 0) {
            filename = outputs[key].images[0].filename; // Grab the first filename
            break;
          }
        }
      }
  
      if (filename) {
        setOutputFilename(filename); // Update state with the filename
        
        // Assuming 'http://134.215.109.213:44363' is your Comfy server's base URL
        const imageUrl = `http://134.215.109.213:44363/view?filename=${filename}`;
        setImageUrl(imageUrl); // Set image URL state
      } else {
        alert('No output filename found.');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Failed to fetch history data.');
    }
  };
  
  const sendDataToComfy = async () => {
    const jsonToComfy = createJsonToComfy(presignedUrl);
    const endpoint = "/proxy-prompt";

    try {
      const response = await axios.post('/proxy-prompt', jsonToComfy, {
        headers: { 'Content-Type': 'application/json' }
      });
      setComfyResponse(response.data); // Store the Comfy response
      setUploadStatus('Data sent to Comfy successfully.');
    } catch (error) {
      console.error('Error sending data to Comfy:', error);
      setUploadStatus('Failed to send data to Comfy.');
    }
  };

  const downloadJson = () => {
    // const jsonToDownload = { fileUrl, presignedUrl }; // Adjust this object as needed for your requirements
    const jsonToDownload = createJsonToComfy(presignedUrl);
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
      {presignedUrl && (
        <>
          <button onClick={downloadJson}>Download JSON</button>
          <button onClick={sendDataToComfy}>Send to Comfy</button>
          {comfyResponse && (
            <div>
              <h3>Response from Comfy:</h3>
              <p>Prompt ID: {comfyResponse.prompt_id}</p>
              <p>Number: {comfyResponse.number}</p>
              {/* Render other data as needed */}
            </div>
          )}
          {comfyResponse && comfyResponse.prompt_id && (
            <button onClick={() => fetchHistoryAndDisplayFilename(comfyResponse.prompt_id)}>
              Get Output Filename
            </button>
          )}
          {outputFilename && <p>Output Filename: {outputFilename}</p>}
        </>
      )}
      {/* Display the image if the URL is available */}
      {imageUrl && <img src={imageUrl} alt="Output from Comfy" />}
    </div>
  );
  
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {uploadStatus && <p>{uploadStatus}</p>}

      {presignedUrl && (
        <>
          <button onClick={downloadJson}>Download JSON</button>
          <button onClick={sendDataToComfy}>Send to Comfy</button>
          {comfyResponse && (
            <div>
              <h3>Response from Comfy:</h3>
              <p>Prompt ID: {comfyResponse.prompt_id}</p>
              <p>Number: {comfyResponse.number}</p>
              {/* You can render other data from the response here */}
            </div>
          )}
        </>
      )}

      {comfyResponse && comfyResponse.prompt_id && (
        <button onClick={() => fetchHistoryAndDisplayFilename(comfyResponse.prompt_id)}>
          Get Output Filename
        </button>
      )}
      {outputFilename && <p>Output Filename: {outputFilename}</p>}
    </div>

    
  );
}

export default UploadComponent;