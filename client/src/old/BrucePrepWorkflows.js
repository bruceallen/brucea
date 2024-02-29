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
//  console.log('best X', newWidth);
//  console.log('best Y', newHeight);
  return { width: newWidth, height: newHeight };
};

export const createJsonToComfy = (option = 'depth', resX = 1024, resY = 1024, presignedUrl, steps = 30, restriction = 0.5, seed = 42) => {  
  if (option === 'depth') {
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
  } else if (option === 'animate') {
    return {
      //start bGIF1L_API.json --------

      "prompt": {

        "8": {
          "inputs": {
            "samples": [
              "38",
              0
            ],
            "vae": [
              "89",
              0
            ]
          },
          "class_type": "VAEDecode",
          "_meta": {
            "title": "VAE Decode"
          }
        },
        "12": {
          "inputs": {
            "width": [
              "94",
              1
            ],
            "height": [
              "94",
              2
            ],
            "video_frames": 24,
            "motion_bucket_id": 50,
            "fps": 24,
            "augmentation_level": 0.05,
            "clip_vision": [
              "15",
              1
            ],
            "init_image": [
              "94",
              0
            ],
            "vae": [
              "89",
              0
            ]
          },
          "class_type": "SVD_img2vid_Conditioning",
          "_meta": {
            "title": "SVD_img2vid_Conditioning"
          }
        },
        "14": {
          "inputs": {
            "min_cfg": 1,
            "model": [
              "15",
              0
            ]
          },
          "class_type": "VideoLinearCFGGuidance",
          "_meta": {
            "title": "VideoLinearCFGGuidance"
          }
        },
        "15": {
          "inputs": {
            "ckpt_name": "SVD/svd_xt.safetensors"
          },
          "class_type": "ImageOnlyCheckpointLoader",
          "_meta": {
            "title": "Image Only Checkpoint Loader (img2vid model)"
          }
        },
        "26": {
          "inputs": {
            "frame_rate": 24,
            "loop_count": 0,
            "filename_prefix": "boa01-",
            "format": "image/gif",
            "pingpong": false,
            "save_output": true,
            "images": [
              "175",
              0
            ]
          },
          "class_type": "VHS_VideoCombine",
          "_meta": {
            "title": "BOA_OUT GIF"
          }
        },
        "38": {
          "inputs": {
            "seed": [
              "200",
              0
            ],
            "steps": steps,
            "cfg": 10 * restriction,
            "sampler_name": "euler",
            "scheduler": "normal",
            "denoise": 1,
            "model": [
              "14",
              0
            ],
            "positive": [
              "12",
              0
            ],
            "negative": [
              "12",
              1
            ],
            "latent_image": [
              "12",
              2
            ]
          },
          "class_type": "KSampler",
          "_meta": {
            "title": "KSampler"
          }
        },
        "89": {
          "inputs": {
            "vae_name": "vae-ft-mse-840000-ema-pruned.safetensors"
          },
          "class_type": "VAELoader",
          "_meta": {
            "title": "Load VAE"
          }
        },
        "90": {
          "inputs": {
            "seed": 537401591692227
          },
          "class_type": "CR Seed",
          "_meta": {
            "title": "🌱 CR Seed"
          }
        },
        "92": {
          "inputs": {
            "url": presignedUrl
          },
          "class_type": "LoadImageByUrl //Browser",
          "_meta": {
            "title": "BOA_IN URL"
          }
        },
        "94": {
          "inputs": {
            "width": [
              "195",
              0
            ],
            "height": [
              "196",
              0
            ],
            "interpolation": "bilinear",
            "keep_proportion": true,
            "condition": "always",
            "image": [
              "92",
              0
            ]
          },
          "class_type": "ImageResize+",
          "_meta": {
            "title": "🔧 Image Resize"
          }
        },
        "107": {
          "inputs": {
            "text": [
              "136",
              0
            ],
            "align": "bottom center",
            "opacity": 0.9,
            "font_name": "Roboto-Regular.ttf",
            "font_size": 24,
            "font_color": "custom",
            "x_margin": 12,
            "y_margin": 24,
            "font_color_hex": "#000000",
            "image": [
              "117",
              0
            ]
          },
          "class_type": "CR Simple Text Watermark",
          "_meta": {
            "title": "🔤️ CR Simple Text Watermark"
          }
        },
        "109": {
          "inputs": {
            "width": 512,
            "height": 512,
            "interpolation": "bilinear",
            "keep_proportion": true,
            "condition": "always",
            "image": [
              "8",
              0
            ]
          },
          "class_type": "ImageResize+",
          "_meta": {
            "title": "🔧 Image Resize"
          }
        },
        "117": {
          "inputs": {
            "left": 48,
            "top": 48,
            "right": 48,
            "bottom": 48,
            "feathering": 0,
            "image": [
              "109",
              0
            ]
          },
          "class_type": "ImagePadForOutpaint",
          "_meta": {
            "title": "Pad Image for Outpainting"
          }
        },
        "121": {
          "inputs": {
            "int_": [
              "200",
              0
            ]
          },
          "class_type": "CR Integer To String",
          "_meta": {
            "title": "🔧 CR Integer To String"
          }
        },
        "125": {
          "inputs": {
            "text1": [
              "190",
              0
            ],
            "text2": [
              "121",
              0
            ],
            "separator": " "
          },
          "class_type": "CR Text Concatenate",
          "_meta": {
            "title": "🔤 CR Text Concatenate"
          }
        },
        "130": {
          "inputs": {
            "int_": 24
          },
          "class_type": "CR Integer To String",
          "_meta": {
            "title": "🔧 CR Integer To String"
          }
        },
        "131": {
          "inputs": {
            "text1": [
              "125",
              0
            ],
            "text2": [
              "132",
              0
            ],
            "separator": ", "
          },
          "class_type": "CR Text Concatenate",
          "_meta": {
            "title": "🔤 CR Text Concatenate"
          }
        },
        "132": {
          "inputs": {
            "text1": [
              "191",
              0
            ],
            "text2": [
              "130",
              0
            ],
            "separator": " "
          },
          "class_type": "CR Text Concatenate",
          "_meta": {
            "title": "🔤 CR Text Concatenate"
          }
        },
        "134": {
          "inputs": {
            "text1": [
              "192",
              0
            ],
            "text2": [
              "137",
              0
            ],
            "separator": " "
          },
          "class_type": "CR Text Concatenate",
          "_meta": {
            "title": "🔤 CR Text Concatenate"
          }
        },
        "136": {
          "inputs": {
            "text1": [
              "131",
              0
            ],
            "text2": [
              "134",
              0
            ],
            "separator": ", "
          },
          "class_type": "CR Text Concatenate",
          "_meta": {
            "title": "🔤 CR Text Concatenate"
          }
        },
        "137": {
          "inputs": {
            "int_": steps
          },
          "class_type": "CR Integer To String",
          "_meta": {
            "title": "🔧 CR Integer To String"
          }
        },
        "141": {
          "inputs": {
            "text1": [
              "193",
              0
            ],
            "text2": "2024.02.27",
            "separator": ""
          },
          "class_type": "CR Text Concatenate",
          "_meta": {
            "title": "🔤 CR Text Concatenate"
          }
        },
        "175": {
          "inputs": {
            "text": [
              "141",
              0
            ],
            "align": "top center",
            "opacity": 0.9,
            "font_name": "Roboto-Regular.ttf",
            "font_size": 24,
            "font_color": "custom",
            "x_margin": 12,
            "y_margin": 12,
            "font_color_hex": "#000000",
            "image": [
              "107",
              0
            ]
          },
          "class_type": "CR Simple Text Watermark",
          "_meta": {
            "title": "🔤️ CR Simple Text Watermark"
          }
        },
        "190": {
          "inputs": {
            "string": "SEED:"
          },
          "class_type": "StringConstant",
          "_meta": {
            "title": "StringConstant"
          }
        },
        "191": {
          "inputs": {
            "string": "FPS:"
          },
          "class_type": "StringConstant",
          "_meta": {
            "title": "StringConstant"
          }
        },
        "192": {
          "inputs": {
            "string": "STEPS:"
          },
          "class_type": "StringConstant",
          "_meta": {
            "title": "StringConstant"
          }
        },
        "193": {
          "inputs": {
            "string": "FROM BRUCE HEROKU TEST - " + "CFG " + 10 * restriction + " - "
          },
          "class_type": "StringConstant",
          "_meta": {
            "title": "StringConstant"
          }
        },
        "195": {
          "inputs": {
            "Value": resX
          },
          "class_type": "Integer",
          "_meta": {
            "title": "BOA_IN WIDTH"
          }
        },
        "196": {
          "inputs": {
            "Value": resY
          },
          "class_type": "Integer",
          "_meta": {
            "title": "BOA_IN HEIGHT"
          }
        },
        "200": {
          "inputs": {
            "ANY": [
              "203",
              0
            ],
            "IF_TRUE": [
              "202",
              0
            ],
            "IF_FALSE": [
              "90",
              0
            ]
          },
          "class_type": "If ANY execute A else B",
          "_meta": {
            "title": "If"
          }
        },
        "201": {
          "inputs": {
            "Value": 768
          },
          "class_type": "Integer",
          "_meta": {
            "title": "BOA_IN SEED"
          }
        },
        "202": {
          "inputs": {
            "Value": seed
          },
          "class_type": "Integer",
          "_meta": {
            "title": "BOA_IN SEED"
          }
        },
        "203": {
          "inputs": {
            "Value": 1
          },
          "class_type": "Integer",
          "_meta": {
            "title": "BOA_IN SPECIFYSEED"
          }
        }
      }

      //end bGIFT1L_API.json ---------
    };
  } else if (option === 'portrait') {
    return {


    };
  };
}