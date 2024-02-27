// BRUCE UPLOADCOMPONENT.JS - 2024.02.26 - Now with Marigold Depth Estimation and seconds elapsed

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CircularProgress } from '@mui/material'; // Import MUI CircularProgress for loading spinner


function UploadComponent() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(''); 
  // const [fileName, setFileName] = useState(''); unused
  const [uploadStatus, setUploadStatus] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [presignedUrl, setPresignedUrl] = useState('');
  const [isLoadingUpload, setIsLoadingUpload] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [comfyResponse, setComfyResponse] = useState(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // some kind of callback hack to make everything work right
  const handleUpload = useCallback(async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    setIsLoadingUpload(true);

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
        setIsLoadingUpload(false);
        setFileUrl(result.fileUrl);
        fetchPresignedUrl(result.fileUrl.split('/').pop());
      } else {
        setUploadStatus('Upload failed: ' + result.message);
        setIsLoadingUpload(false);
      }
    } catch (error) {
      console.error('Error uploading the file:', error);
      setUploadStatus('Upload failed: ' + error.message);
      setIsLoadingUpload(false);
    }
  }, [file]); // Include any dependencies of handleUpload here

  useEffect(() => {
    if (file) {
      handleUpload();
    }
  }, [file, handleUpload]); // Now handleUpload is included in the dependency array


  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  //  setFileName(selectedFile.name); unused
  };

  const checkImageAvailability = async (imageUrl) => {
    setIsImageProcessing(true); // Start loading state
  
    try {
      // Use the proxy endpoint for CORS
      const response = await fetch(`/check-image-availability?imageUrl=${encodeURIComponent(imageUrl)}`);
      const data = await response.json();
  
      if (data.success) {
        setImageUrl(imageUrl); // Image is available, set image URL state
        setIsImageProcessing(false); // End loading state
        setUploadStatus('Image processing complete.');
      } else {
        // Retry or handle image not available yet
        setIsImageProcessing(true); // Optionally keep loading state if retrying
        setUploadStatus('Waiting for image...');
        // Optionally implement a retry mechanism here
      }
    } catch (error) {
      console.error('Error checking image availability:', error);
      setIsImageProcessing(false); // End loading state
      setUploadStatus('Failed to check image availability.');
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
      } else {
        console.error('Failed to get presigned URL:', result.message);
      }
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
    }
  };

  const createJsonToComfy = (presignedUrl) => {
    return {
      "prompt": {
        "9": {
          "inputs": {
            "filename_prefix": "ComfyUI",
            "images": [
              "17",
              0
            ]
          },
          "class_type": "SaveImage",
          "_meta": {
            "title": "Save Image"
          }
        },
        "10": {
          "inputs": {
            "url": presignedUrl
          },
          "class_type": "LoadImageByUrl //Browser",
          "_meta": {
            "title": "Load Image By URL"
          }
        },
        "16": {
          "inputs": {
            "width": 768,
            "height": 768,
            "interpolation": "bicubic",
            "keep_proportion": true,
            "condition": "only if bigger",
            "image": [
              "10",
              0
            ]
          },
          "class_type": "ImageResize+",
          "_meta": {
            "title": "🔧 Image Resize"
          }
        },
        "17": {
          "inputs": {
            "seed": 123,
            "denoise_steps": 10,
            "n_repeat": 10,
            "regularizer_strength": 0.02,
            "reduction_method": "median",
            "max_iter": 5,
            "tol": 0.001,
            "invert": true,
            "keep_model_loaded": true,
            "n_repeat_batch_size": 2,
            "use_fp16": true,
            "scheduler": "DDIMScheduler",
            "normalize": true,
            "image": [
              "16",
              0
            ]
          },
          "class_type": "MarigoldDepthEstimation",
          "_meta": {
            "title": "MarigoldDepthEstimation"
          }
        }
      }
    };
  };
  
  // Adjusted function to fetch history and then check for image availability
  const fetchHistoryAndDisplayFilename = async (promptId) => {
    try {
      const response = await axios.get(`/proxy-history/${promptId}`);
      const historyData = response.data[promptId];

      let filename = '';
      if (historyData.outputs) {
        for (const key in historyData.outputs) {
          if (historyData.outputs[key].images && historyData.outputs[key].images.length > 0) {
            filename = historyData.outputs[key].images[0].filename;
            break;
          }
        }
      }

      if (filename) {
        setOutputFilename(filename); // Update state with the filename
        const imageUrl = `http://134.215.109.213:44363/view?filename=${filename}`;
        checkImageAvailability(imageUrl); // Check if the image is available before showing it
      } else {
        setIsImageProcessing(false); // Update loading state
        alert('No output filename found.');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setIsImageProcessing(false); // Update loading state
      alert('Failed to fetch history data.');
    }
  };

  const sendDataToComfy = async () => {
    setIsImageProcessing(true);
    setSecondsElapsed(0);
    const jsonToComfy = createJsonToComfy(presignedUrl);

    try {
      const response = await axios.post('/proxy-prompt', jsonToComfy, {
        headers: { 'Content-Type': 'application/json' }
      });
      setComfyResponse(response.data); // Store the Comfy response
      setUploadStatus('Data sent to Comfy successfully.');
      // Start polling for the history information after sending data to Comfy
      if (response.data && response.data.prompt_id) {
        pollForComfyProcessing(response.data.prompt_id);
      }
    } catch (error) {
      console.error('Error sending data to Comfy:', error);
      setUploadStatus('Failed to send data to Comfy.');
    } finally {
      setIsImageProcessing(false);
    }
  };

  async function pollForComfyProcessing(promptId, attempts = 0, maxAttempts = 15, interval = 1000) {
    if (attempts >= maxAttempts) {
        setUploadStatus('Comfy processing has timed out.');
        setIsImageProcessing(false);
        return;
    }

    try {
        const response = await fetch(`/proxy-history/${promptId}`);
        const data = await response.json();
        if (response.ok && Object.keys(data).length !== 0) { // Check if data is not an empty object
            console.log('Comfy processing complete:', data);
            setUploadStatus('Comfy processing complete.');
            setIsImageProcessing(false);
            // Update your UI based on `data` here
            // For example, display the processed image and filename
            fetchHistoryAndDisplayFilename(promptId); // This will set the image URL and output filename
        } else {
            // If data is empty, or response is not OK, consider processing as still ongoing
            setIsImageProcessing(true);
            console.log('Comfy processing ongoing... seconds elapsed:', attempts);
            setSecondsElapsed(attempts);
            setTimeout(() => pollForComfyProcessing(promptId, attempts + 1), interval);
        }
    } catch (error) {
        console.error('Error checking Comfy processing status:', error);
        alert(`Error checking Comfy processing status: ${error}`);
        if (attempts < maxAttempts) {
            setTimeout(() => pollForComfyProcessing(promptId, attempts + 1), interval);
        } else {
            setUploadStatus('Failed to check Comfy processing status.');
            setIsImageProcessing(false);
        }
    }
  };
  
// - END NEW
  



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
    <div className="smallText">
      <input type="file" onChange={handleFileChange} disabled={isLoadingUpload || isImageProcessing} />
      {uploadStatus && <p>{uploadStatus}</p>}
  
      {presignedUrl && (
        <>
          <button onClick={downloadJson}>Download JSON</button>
          <button onClick={sendDataToComfy} disabled={isLoadingUpload || isImageProcessing}>Send to Comfy</button>
          {comfyResponse && (
            <div>
              <h3>Response from Comfy:</h3>
              <p>Prompt ID: {comfyResponse.prompt_id}</p>
              <p>Number: {comfyResponse.number}</p>
              {/* Render other data as needed */}
            </div>
          )}
          {outputFilename && <p>Output Filename: {outputFilename}</p>}
        </>
      )}

      {/* Upload loading indicator */}
      {isLoadingUpload && (
        <div>
          <CircularProgress /> {/* Show a spinner during file upload */}
          <p>Uploading file...</p>
        </div>
      )}

      {/* Comfy processing loading indicator */}
      {isImageProcessing && (
        <div>
          <CircularProgress /> {/* Show a spinner during Comfy processing */}
          <p>Processing image with Comfy...</p>
          <p>Seconds Elapsed: {secondsElapsed}</p>
        </div>
      )}

      {/* Display upload status */}
      <p>{uploadStatus}</p>

      {/* Output image if available */}
      {imageUrl && <img src={imageUrl} alt="Processed" />}
    </div>
  );
}

export default UploadComponent;