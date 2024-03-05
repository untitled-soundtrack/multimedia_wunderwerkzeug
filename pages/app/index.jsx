import {
  Spin,
  Upload,
  Input,
  Button,
  message,
  Dropdown,
  Space,
  Menu,
  Select,
} from "antd";

import { useEffect, useRef, useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { InboxOutlined, ToolTwoTone } from "@ant-design/icons";
import { fileTypeFromBuffer } from "file-type";
import { Analytics } from "@vercel/analytics/react";
import numerify, { options } from "numerify/lib/index.cjs";
import qs from "query-string";
import JSZip from "jszip";
import { FFprobeWorker } from "ffprobe-wasm";
import Emoji from 'a11y-react-emoji'

const { Dragger } = Upload;

const App = () => {
  const [spinning, setSpinning] = useState(false);
  const [tip, setTip] = useState(false);
  const [inputOptions, setInputOptions] = useState("-i");
  const [outputVideoOptions, setOutputVideoOptions] = useState("");
  const [outputAudioOptions, setOutputAudioOptions] = useState("");
  const [outputContainerOptions, setOutputContainerOptions] = useState("");
  const [files, setFiles] = useState("");
  const [outputFiles, setOutputFiles] = useState([]);
  const [href, setHref] = useState("");
  const [file, setFile] = useState();
  const [fileList, setFileList] = useState([]);
  const [name, setName] = useState("eingabe.mp4");
  const [output, setOutput] = useState("ausgabe");
  const [downloadFileName, setDownloadFileName] = useState("output");
  const ffmpeg = useRef();
  const currentFSls = useRef([]);
  const [VideoDisabled, setVideoDisabled] = useState(true);
  const [AudioDisabled, setAudioDisabled] = useState(true);
  const [videoCodec, setVideoCodec] = useState([]);
  const [audioCodec, setAudioCodec] = useState([]);  

  const [fileSize, setFileSize] = useState([0]);
  const [fileDuration, setFileDuration] = useState([0]);
  const [fileBitrate, setFileBitrate] = useState([0]);
  const [fileFormat, setFileFormat] = useState([""]);

  const worker = new FFprobeWorker();

  // FFMPEG container & codec variations
  const containers = [
    {
      value: ".aac",
      label: "aac",
    },
    {
      value: ".avi",
      label: "avi",
    },
    {
      value: ".mkv",
      label: "mkv",
    },
    {
      value: ".mov",
      label: "mov",
    },
    {
      value: ".mp3",
      label: "mp3",
    },
    {
      value: ".mp4",
      label: "mp4",
    },
    {
      value: ".wav",
      label: "wav",
    },
    {
      value: ".webm",
      label: "webm",
    },
  ];

  const audiocodecAAC = [
    {
      value: " -c:a aac -b:a 320K ",
      label: "AAC",
    },
  ];

  const videocodecAVI = [
    {
      value: " -c:v libx264 -crf 18 -pix_fmt yuv420p ",
      label: "H.264",
    },
    {
      value: " -c:v libx265 -crf 18 -pix_fmt yuv420p ",
      label: "H.265",
    },
    {
      value: " -c:v prores -profile:v 1 -pix_fmt yuv420p ",
      label: "ProRes",
    },
  ];

  const audiocodecAVI = [
    {
      value: " -c:a aac ",
      label: "AAC",
    },
    {
      value: " -c:a libmp3lame -b:a 320K  ",
      label: "MP3",
    },
    {
      value: " -c:a pcm_s16le   ",
      label: "PCM",
    },
  ];

  const videocodecMKV = [
    {
      value: " -c:v libx264 -crf 18 -pix_fmt yuv420p ",
      label: "H.264",
    },
    {
      value: " -c:v libx265 -crf 18 -pix_fmt yuv420p ",
      label: "H.265",
    },
  ];

  const audiocodecMKV = [
    {
      value: " -c:a aac ",
      label: "AAC",
    },
    {
      value: " -c:a libmp3lame -b:a 320K  ",
      label: "MP3",
    },
    {
      value: " -c:a pcm_s16le   ",
      label: "PCM",
    },
  ];

  const videocodecMOV = [
    {
      value: " -c:v libx264 -crf 18 -pix_fmt yuv420p ",
      label: "H.264",
    },
    {
      value: " -c:v libx265 -crf 18 -pix_fmt yuv420p ",
      label: "H.265",
    },
    {
      value: " -c:v prores -profile:v 1 ",
      label: "ProRes",
    },
  ];

  const audiocodecMOV = [
    {
      value: " -c:a aac ",
      label: "AAC",
    },
    {
      value: " -c:a libmp3lame -b:a 320K  ",
      label: "MP3",
    },
    {
      value: " -c:a pcm_s16le   ",
      label: "PCM",
    },
  ];

  const audiocodecMP3 = [
    {
      value: " -c:a libmp3lame -b:a 320K  ",
      label: "MP3",
    },
  ];

  const videocodecMP4 = [
    {
      value: " -c:v libx264 -crf 18 -pix_fmt yuv420p ",
      label: "H.264",
    },
    {
      value: " -c:v libx265 -pix_fmt yuv420p ",
      label: "H.265",
    },
    {
      value: " -c:v libvpx-vp9 -crf 18 ",
      label: "VP9",
    },
  ];

  const audiocodecMP4 = [
    {
      value: " -c:a aac ",
      label: "AAC",
    },
    {
      value: " -c:a libmp3lame -b:a 320K  ",
      label: "MP3",
    },
  ];

  const audiocodecWAV = [
    {
      value: " -c:a pcm_s16le ",
      label: "PCM",
    },
    {
      value: " -c:a libmp3lame -b:a 320K  ",
      label: "MP3",
    },
  ];

  const videocodecWEBM = [
    {
      value: " -c:v libvpx-vp9 -crf 18 ",
      label: "VP9",
    },
  ];

  const audiocodecWEBM = [
    {
      value: " -c:a libopus -b:a 320K ",
      label: "Opus",
    },
  ];

  const handleVideoChange = (value) => {
    setOutputVideoOptions(value);
  };

  const handleAudioChange = (value) => {
    setOutputAudioOptions(value);
  };

  // Output Options depends on the selected container
  const handleContainerChange = (value) => {
    setOutputContainerOptions(value);
    console.log("outputContainerOptions:" + value);

    switch (value) {
      case ".aac":
        setAudioDisabled(false);
        setVideoDisabled(true);        
        setAudioCodec(audiocodecAAC);
        break;
      case ".avi":
        setAudioDisabled(false);
        setVideoDisabled(false);
        setVideoCodec(videocodecAVI);
        setAudioCodec(audiocodecAVI);
        break;
      case ".mkv":
        setAudioDisabled(false);
        setVideoDisabled(false);
        setVideoCodec(videocodecMKV);
        setAudioCodec(audiocodecMKV);
        break;
      case ".mov":
        setAudioDisabled(false);
        setVideoDisabled(false);
        setVideoCodec(videocodecMOV);
        setAudioCodec(audiocodecMOV);
        break;
      case ".mp3":
        setAudioDisabled(false);
        setVideoDisabled(true);
        setAudioCodec(audiocodecMP3);
        break;
      case ".mp4":
        setAudioDisabled(false);
        setVideoDisabled(false);
        setVideoCodec(videocodecMP4);
        setAudioCodec(audiocodecMP4);
        break;
      case ".wav":
        setAudioDisabled(false);
        setVideoDisabled(true);
        setAudioCodec(audiocodecWAV);
        break;
      case ".webm":
        setAudioDisabled(false);
        setVideoDisabled(false);
        setVideoCodec(videocodecWEBM);
        setAudioCodec(audiocodecWEBM);
        break;
    }
  };

  // Experimental media info with ffprobe from input data
  const handleMediaInfo = async ()  => {
    try{
      const fileInfo = await worker.getFileInfo(file);
      const fileBitrate = Math.round(fileInfo.format.bit_rate/1000000);
      const fileSize = Math.round(fileInfo.format.size/1000000);
      const fileFormat = fileInfo.format.format_long_name;
      const fileDuration = Math.round(fileInfo.format.duration);

      setFileBitrate(fileBitrate);
      setFileSize(fileSize);
      setFileFormat(fileFormat);
      setFileDuration(fileDuration);

      console.log("duration: " +  fileDuration + " s");      
      console.log("format_long_name: " + fileFormat);
      console.log("bit_rate: " +  fileBitrate + " Mbps");      
      console.log("size: " + fileSize + " MB");
    }catch{
      console.log("Metadaten nicht auslesbar!");
    }   
  };

  // Execution of the transcode commands
  const handleExec = async () => {
    if (!file) {
      return;
    }
    setOutputFiles([]);
    setHref("");
    setDownloadFileName("");
    try {
      setTip("Datei wird in den Browser geladen");
      // Starting Spinning icon for loading
      setSpinning(true);
      // Write the input file(s) to the FFMPEG file system
      for (const fileItem of fileList) {
        ffmpeg.current.FS(
          "writeFile",
          fileItem.name,
          await fetchFile(fileItem)
        );
      }
      currentFSls.current = ffmpeg.current.FS("readdir", ".");
      setTip("Starte die Ausführung");

      // Execute the final FFMPEG command line
      await ffmpeg.current.run(
        inputOptions,
        name,
        ...outputVideoOptions.split(" "),
        ...outputAudioOptions.split(" "),
        output + outputContainerOptions
      );

      // End of Spinning icon for loading
      setSpinning(false);
      const FSls = ffmpeg.current.FS("readdir", ".");
      const outputFiles = FSls.filter((i) => !currentFSls.current.includes(i));
      
      // Read the outcome file back from the FFMPEG file system
      if (outputFiles.length === 1) {
        const data = ffmpeg.current.FS("readFile", outputFiles[0]);
        const type = await fileTypeFromBuffer(data.buffer);

        //Create the outcome file
        const objectURL = URL.createObjectURL(
          new Blob([data.buffer], { type: type.mime })
        );
        setHref(objectURL);
        setDownloadFileName(outputFiles[0]);
        message.success(
          "Transcoding erfolgreich, Klicke auf dem Download Button",
          10
        );
      }else {
        message.success(
          "Transcoding erfolgreich, keine Datei erstellt! Öffne die Konsole um mehr Informationen zu erhalten.",
          10
        );
      }
    } catch (err) {
      console.error(err);
      message.error(
        "Transcoding fehlgeschlagen! Öffne die Konsole um mehr Informationen zu erhalten.",
        10
      );
    }
  }; 

  // Create the FFMPEG instance and load it for transcoding
  useEffect(() => {
    (async () => {
      ffmpeg.current = createFFmpeg({
        log: true,
        corePath:
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
      });
      ffmpeg.current.setProgress(({ ratio }) => {
        console.log(ratio);
        setTip(numerify(ratio, "0.0%"));
      });
      setTip("ffmpeg static resource geladen...");
      setSpinning(true);
      await ffmpeg.current.load();
      setSpinning(false);
    })();
  }, []);

  // Use always current input & output options 
  useEffect(() => {
    const {
      inputOptions,
      outputVideoOptions,
      outputAudioOptions,
      output,
      outputContainerOptions,
    } = qs.parse(window.location.search);
    if (inputOptions) {
      setInputOptions(inputOptions);
    }
    if (outputVideoOptions) {
      setOutputVideoOptions(outputVideoOptions);
    }
    if (outputAudioOptions) {
      setOutputAudioOptions(outputAudioOptions);
    }
    if (outputAudioOptions) {
      setOutputAudioOptions(outputAudioOptions);
    }
    if (output) {
      setOutput(output);
    }
    if (outputContainerOptions) {
      setOutputContainerOptions(outputContainerOptions);
    }
  }, []);

  // Use always current path
  useEffect(() => {    
    setTimeout(() => {
      let queryString = qs.stringify({
        inputOptions,
        outputVideoOptions,
        outputAudioOptions,
        output,
        outputContainerOptions,
      });
      const newUrl = `${location.origin}${location.pathname}?${queryString}`;
      history.pushState("", "", newUrl);
    });
  }, [
    inputOptions,
    outputVideoOptions,
    outputAudioOptions,
    output,
    outputContainerOptions,
  ]);

  return (
    <div className="page-app">
      {spinning && (
        <Spin spinning={spinning} tip={tip}>
          <div className="component-spin" />
        </Spin>
      )}     
      <h2 align="center"><Emoji symbol="📼" label="vhs" /> Das Multimedia Wunderwerkzeug</h2>     
      <h4>1. Wähle die Ausgangsdatei aus</h4>     

      <Dragger
        multiple
        beforeUpload={(file, fileList) => {
          setFile(file);
          setFileList((v) => [...v, ...fileList]);
          setName(file.name);
          return false;
        }}
        
        onChange={handleMediaInfo}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Klicke oder ziehe die Datei hinein</p>
      </Dragger>

      {/* Display metadata for input file*/}
      <div className="command-text">
          <h3>Metadaten: </h3>
          <p>Name: {name}</p>   
          <p>Dauer: {fileDuration} s</p>  
          <p>Format: {fileFormat}</p>  
          <p>Bitrate: {fileBitrate} Mbps</p>
          <p>Dateigröße: {fileSize} MB</p>        
      </div>

      <h4>2. Konfiguration der Export-Optionen</h4>
      <div className="exec">       

        <Select
          name="selectContainer"
          placeholder="Container"
          onChange={handleContainerChange}
          options={containers}
        />

        <Select
          placeholder="Video Codec"
          onChange={handleVideoChange}
          notFoundContent={"Video Codec"}                   
          disabled={VideoDisabled}
          options={videoCodec}
          defaultActiveFirstOption
        />

        <Select
          placeholder="Audio Codec"
          onChange={handleAudioChange}
          notFoundContent={"Audio Codec"}          
          disabled={AudioDisabled}
          options={audioCodec}
          defaultActiveFirstOption
        />

        <Input
          value={output}
          placeholder="Gebe den Namen für den Export an"
          onChange={(event) => setOutput(event.target.value)}
        />

        {/* Display final FFMPEG outcome command*/}
        <div className="command-text">
          ffmpeg {inputOptions} {name}
          {outputVideoOptions}
          {outputAudioOptions}
          {output}
          {outputContainerOptions}
        </div>
      </div>

      <h4>3. Transcoding der Ausgangsdatei</h4>
      <Button type="primary" disabled={!Boolean(file)} onClick={handleExec}>
        Export starten
      </Button>
      <br />
      <br />
      {href && (
        <a href={href} download={downloadFileName}>
          Datei downloaden
        </a>
      )}

      <br />
      <br />
      {/* Display download button for the transcoded file */}
      {outputFiles.map((outputFile, index) => (
        <div key={index}>
          <a href={outputFile.href} download={outputFile.name}>
            {outputFile.name}
          </a>
          <br />
        </div>
      ))}
      <br />
      <br />
    </div>
  );
};

export default App;
