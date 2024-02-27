// BRUCE BRUCEPREPWORKFLOWS.JS - 2024.02.27 - refactor

export const calculateBestProjectResolution = (width, height, base = 1024) => {
  // Ensure the total pixel count is less than or equal to 1024x1024 (or whatever base is set to)
  if (width * height <= base * base) {
    console.log('scaling up');
  //      return { width, height }; // If it's already compliant, return original
  }

  // Calculate the aspect ratio
  const aspectRatio = width / height;

  // Calculate the new dimensions
  let newWidth = Math.sqrt((base * base) * aspectRatio);
  let newHeight = base * base / newWidth;

  // Ensure dimensions are multiples of 32
  newWidth = Math.floor(newWidth / 32) * 32;
  newHeight = Math.floor(newHeight / 32) * 32;

  // Adjust one dimension if necessary to maintain aspect ratio
  // This could happen if rounding down changes the ratio
  if (Math.abs((newWidth / newHeight) - aspectRatio) > 0.01) { // Allowing slight deviation
      if (newWidth / newHeight > aspectRatio) {
          // Width is too large
          newWidth = newHeight * aspectRatio;
          newWidth = Math.floor(newWidth / 32) * 32; // Ensure multiple of 32
      } else {
          // Height is too large
          newHeight = newWidth / aspectRatio;
          newHeight = Math.floor(newHeight / 32) * 32; // Ensure multiple of 32
      }
  }

  console.log('best X', newWidth);
  console.log('best Y', newHeight);

  return { width: newWidth, height: newHeight };
};

export const createJsonToComfy = (presignedUrl, resX, resY, option = 1) => {  
  if (option == 1) {
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
            "width": resX,
            "height": resY,
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
            "denoise_steps": 8,
            "n_repeat": 4,
            "regularizer_strength": 0.02,
            "reduction_method": "median",
            "max_iter": 5,
            "tol": 0.001,
            "invert": true,
            "keep_model_loaded": true,
            "n_repeat_batch_size": 4,
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
}