// BRUCE UPLOADCOMPONENT.JS - 2024.02.27 - Now with Marigold Depth Estimation and seconds elapsed and JPEG filtering
// TODO: handle .HEIF files

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CircularProgress } from '@mui/material'; // Import MUI CircularProgress for loading spinner

import { createJsonToComfy, calculateBestProjectResolution } from './BrucePrepWorkflows';

function UploadComponent() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(''); 
  // const [fileName, setFileName] = useState(''); unused
  const [uploadStatus, setUploadStatus] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cachedResultImageUrl, setCachedResultImageUrl] = useState('');
  const [cachedResultPresignedImageUrl, setCachedResultPresignedImageUrl] = useState('');
  const [presignedUrl, setPresignedUrl] = useState('');
  const [isLoadingUpload, setIsLoadingUpload] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [comfyResponse, setComfyResponse] = useState(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [bestWidth, setBestWidth] = useState(0);
  const [bestHeight, setBestHeight] = useState(0);

  const [resX, setResX] = useState(1024);
  const [resY, setResY] = useState(1024);

  const [s3ImageUrl, setS3ImageUrl] = useState('');

  useEffect(() => {
    console.log('Updated resolution:', resX, 'x', resY);
  }, [resX, resY]);

  // some kind of callback hack to make everything work right
  const handleUpload = useCallback(async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    setIsLoadingUpload(true); // Show loading indicator

    const formData = new FormData();
    formData.append('file', file); // Append file to form data

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
        setIsLoadingUpload(false); // Hide loading indicator
        setFileUrl(result.fileUrl); // Set the URL of the uploaded file

        setOriginalWidth(result.resolutionX);
        setOriginalHeight(result.resolutionY);

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
        console.log('checkImageAvailability IT IS READY TO COPY TO S3');
        // -------- BEGIN S3
        // Image is available, now upload it to S3
        const s3Response = await fetch('/post-image', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl }),
        });
        const s3Data = await s3Response.json();


        if (s3Data.success) {
            console.log('Image successfully uploaded to S3:', s3Data.imageUrl); 
           //  const debugurl = JSON.stringify(s3Data);
           //  console.log('got S3 data:', debugurl);    
            // If the image has been successfully uploaded to S3, set the S3 image URL state
            setCachedResultImageUrl(s3Data.imageUrl); // Update to use the S3 image URL
            setIsImageProcessing(false); // End loading state
            setUploadStatus('Image processing complete and uploaded to S3.');

 
            fetchCachedResultPresignedImageUrl(s3Data.imageUrl.split('/').pop());
            console.log('got RESULT S3 PRESIGNED URL:', cachedResultPresignedImageUrl);            
//            cachedResultPresignedImageUrl
        } else {
            console.error('Failed to upload image to S3', s3Data.message);
            setIsImageProcessing(false); // End loading state
            setUploadStatus('Failed to upload image to S3.');
        }
        // -------- END S3
        // setImageUrl(imageUrl); // Image is available, set image URL state
        // setIsImageProcessing(false); // End loading state
        // setUploadStatus('Image processing complete.');
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
  
  const fetchCachedResultPresignedImageUrl = async (fileName) => {
    try {
      const response = await fetch(`/generate-presigned-url?fileName=${encodeURIComponent(fileName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch presigned URL');
      }

      const result = await response.json();
      if (result.success) {
        setCachedResultPresignedImageUrl(result.presignedUrl);
      } else {
        console.error('Failed to get presigned URL:', result.message);
      }
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
    }
  };
  
  // Adjusted function to fetch history and then check for image availability
  const fetchHistoryAndDisplayFilename = async (promptId) => {
    try {
      // Fetching history data from your proxy service
      const response = await axios.get(`/proxy-history/${promptId}`);
      const historyData = response.data[promptId];

      let filename = '';
      if (historyData.outputs) {
        for (const key in historyData.outputs) {
          if (historyData.outputs[key].images && historyData.outputs[key].images.length > 0) {
            filename = historyData.outputs[key].images[0].filename;
            break;  // Found the image, exit the loop
          }
        }
      }

      if (filename) {
        setOutputFilename(filename); // Update state with the filename
        const imageUrl = `http://134.215.109.213:44363/view?filename=${filename}`;
        console.log('fetchHistoryAndDisplayFilename GOT BACKEND URL:', imageUrl);
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

    console.log('Calculating best resolution');

    const {width, height} = calculateBestProjectResolution(originalWidth, originalHeight);
    console.log('Best resolution:', width, 'x', height);

    setResX(width);
    setResY(height);

    console.log('new X', resX);
    console.log('new Y', resY);

    const jsonToComfy = createJsonToComfy(presignedUrl, resolutionX, resolutionY, 1);

    const jsonString = JSON.stringify(jsonToComfy);

    // Log the JSON string to console or any other logging mechanism you prefer
    console.log("JSON being sent:", jsonString);

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

  async function pollForComfyProcessing(promptId, attempts = 0, maxAttempts = 480, interval = 1000) {
    if (attempts >= maxAttempts) {
        setUploadStatus('Comfy processing has timed out.');
        setIsImageProcessing(false);
        return;
    }

    try {
        const response = await fetch(`/proxy-history/${promptId}`);
        const data = await response.json();
        if (response.ok && Object.keys(data).length !== 0) { // Check if data is not an empty object
            console.log('Processing complete:', data);
            console.log('Processing seconds elapsed:', attempts);
            setUploadStatus('Comfy processing complete.');
  
            setIsImageProcessing(false);
            // Update your UI based on `data` here
            // For example, display the processed image and filename
            fetchHistoryAndDisplayFilename(promptId); // This will set the image URL and output filename
        } else {
            // If data is empty, or response is not OK, consider processing as still ongoing
            setIsImageProcessing(true);
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
      <p>File URL: {fileUrl}</p>
      <p>Project Resolution: {resX}x{resY}</p>

      <input type="file" accept="image/jpeg" onChange={handleFileChange} disabled={isLoadingUpload || isImageProcessing} />
      {uploadStatus && <p>{uploadStatus}</p>}
  
      {presignedUrl && (
        <>
          <button onClick={sendDataToComfy} disabled={isLoadingUpload || isImageProcessing}>PROCESS IMAGE</button>
          {comfyResponse && (
            <div>
              <h3>Response:</h3>
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
          <p>Processing image...</p>
          <p>Seconds Elapsed: {secondsElapsed}</p>
        </div>
      )}

      {/* Display upload status */}
      <p>{uploadStatus}</p>

      {/* Output image if available */}

      {cachedResultPresignedImageUrl && <img src={cachedResultPresignedImageUrl} alt="Processed" />}
    </div>
  );
}

export default UploadComponent;

//           <button onClick={downloadJson}>Download JSON</button>
// {s3ImageUrl && <img src={s3ImageUrl} alt="Image from S3" />}

//       {imageUrl && <img src={imageUrl} alt="Processed" />}