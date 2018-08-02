"Copyright 2014-2018 Greg Simon"

var midi = null;
var midiIn = null;
var midiOut = null;
var selectMIDIIn = null;
var selectMIDIOut = null;
var deviceId = 0x10; // JV-1010
var modelId = 0x6a; // JV-1010
var studioSetControlChannel = 16;


function jv_init() {
  navigator.requestMIDIAccess({sysex:true}).then(onSuccessCallback, onMIDIFailCallback);
}

// used for chaining
var g_next_midi_callback_fn = undefined;

function midiMessageReceived(event) {
  
  if (event.data.length == 1)
    return;

  console.log("TODO : midiMessageReceived " + event.data.length);

  if (event.data[0] = 0xf0) { // sysex
    let data = event.data;
    if (data[1] == 0x41 && data[2] == deviceId && data[3] == modelId) {
      switch (data[4]) { // cmd
        case 0x12: // DT1
        cmd_dt1_received(data);
        break;
      }
    }
    
  } else {
    printArrayHex(event.data);
  }

  return;
	console.log("MIDI MESSAGE IN "+(event.data.length-13)+
      " addr "+event.data[7].toString(16)+" "+
      event.data[8].toString(16)+" "+
      event.data[9].toString(16)+" "+event.data[10].toString(16)) ;
  

  //if (g_next_midi_callback_fn != undefined)
  //  g_next_midi_callback_fn(event);
}

var g_bank_index =-1;
var g_bank_collection_fns = [
  {fn:collectSNA_Preset, type:"Preset", eng:"SuperNATURAL-Acoustic"},
  {fn:collectSNA_User, type:"User", eng:"SuperNATURAL-Acoustic"},
  {fn:collectSNS_Preset, type:"Preset", eng:"SuperNATURAL-Synth"},
  {fn:collectSNS_User, type:"User", eng:"SuperNATURAL-Synth"},
  {fn:collectSND_Preset, type:"Preset", eng:"SuperNATURAL-Drums"},
  {fn:collectSND_User, type:"User", eng:"SuperNATURAL-Drums"},
  {fn:collectPCMS_Preset, type:"Preset", eng:"PCM-Synth"},
  {fn:collectPCMS_User, type:"User", eng:"PCM-Synth"},
  {fn:collectPCMD_Preset, type:"Preset", eng:"PCM-Drums"},
  {fn:collectPCMD_User, type:"User", eng:"PCM-Drums"},

  {fn:collectSRX01_Tone, type:"SRX", eng:"SRX01"},
  {fn:collectSRX02_Tone, type:"SRX", eng:"SRX02"},
  {fn:collectSRX03_Tone, type:"SRX", eng:"SRX03"},
  {fn:collectSRX03_Drum, type:"SRX", eng:"SRX03 Drums"},
  {fn:collectSRX04_Tone, type:"SRX", eng:"SRX04"},
  {fn:collectSRX05_Tone, type:"SRX", eng:"SRX05"},
  {fn:collectSRX05_Drum, type:"SRX", eng:"SRX05 Drums"},
  {fn:collectSRX06_Tone, type:"SRX", eng:"SRX06"},
  {fn:collectSRX06_Drum, type:"SRX", eng:"SRX06 Drums"},
  {fn:collectSRX07_Tone, type:"SRX", eng:"SRX07"},
  {fn:collectSRX07_Drum, type:"SRX", eng:"SRX07 Drums"},
  {fn:collectSRX08_Tone, type:"SRX", eng:"SRX08"},
  {fn:collectSRX08_Drum, type:"SRX", eng:"SRX08 Drums"},
  {fn:collectSRX09_Tone, type:"SRX", eng:"SRX09"},
  {fn:collectSRX10_Tone, type:"SRX", eng:"SRX10"},
  {fn:collectSRX11_Tone, type:"SRX", eng:"SRX11"},
  {fn:collectSRX12_Tone, type:"SRX", eng:"SRX12"}, 
  undefined
];

var g_tones = [];

function cmd_dt1_received(data) {
  // what address is this?
  // addr is 5,6,7,8
  let size = data.length - 11;

  if (data[5]=0x03 && data[6]==0x00) {
    switch(data[7]) {
      case 0x00: // common
      parse_common(data);
      break;
      case 0x10: // common
      parse_tone(1, data);
      break;
      case 0x12: // common
      parse_tone(2, data);
      break;
      case 0x14: // common
      parse_tone(3, data);
      break;
      case 0x16: // common
      parse_tone(4, data);
      break;
    }

  }

  console.log(data[5].toString(16) + " " + 
      data[6].toString(16) + " " + 
      data[7].toString(16) + " " + 
      data[8].toString(16) + "  sz=" + size);

}

function parse_tone(number, data) {
  console.log("parse tone " + number);
  var tone = {};
  data = data.slice(9, -1);

  tone.toneSwitch = data[0];
  tone.waveGroupType = data[1];
  tone.waveGroupId = data[2];
  tone.waveGroupNumber = [data[3], data[4]];
  tone.waveGain = data[5];
  tone.fxmSwitch = data[6];
  tone.fxmColor = data[7];
  tone.fxmDepth = data[8];
  tone.toneDelayMode = data[9];
  tone.toneDelayTime = data[0xa];
  tone.velocityCrossFade = data[0xb];
  tone.velocityRange = [data[0xc], data[0xd]];
  tone.keyboardRange = [data[0xe], data[0xf]];
  tone.redamperControlSwitch = data[0x10];
  tone.volumeControlSwitch = data[0x11];
  tone.hold1ControlSwitch = data[0x12];
  tone.pitchBendControlSwitch = data[0x13];
  tone.panControlSwitch = data[0x14];

  tone.controller = [
  [[ data[0x15], data[0x16]],
   [ data[0x17], data[0x18]],
   [ data[0x19], data[0x1a]],
   [ data[0x1b], data[0x1c]]
   ],
  [[ data[0x1d], data[0x1e]],
   [ data[0x1f], data[0x20]],
   [ data[0x21], data[0x22]],
   [ data[0x23], data[0x24]]
   ],
  [[ data[0x25], data[0x26]],
   [ data[0x27], data[0x28]],
   [ data[0x29], data[0x2a]],
   [ data[0x2b], data[0x2c]]
   ]
  ];

  tone.lfo = [
  { waveform:data[0x2d], keySync:data[0x2e], rate:data[0x2f], offset:data[0x30], 
    delayTime:data[0x31], fadeMode:data[0x32], fadeTime:data[0x33], externalSync:data[0x34]},
  { waveform:data[0x35], keySync:data[0x36], rate:data[0x37], offset:data[0x38], 
    delayTime:data[0x39], fadeMode:data[0x3a], fadeTime:data[0x3b], externalSync:data[0x3c]},
  ]

  tone.courseTune = data[0x3d];
  tone.fineTune = data[0x3e];
  tone.randomPitchDepth = data[0x3f];
  tone.pitchKeyfollow = data[0x40];
  tone.pitchEnvelopeDepth = data[0x41];
  tone.pitchEnvelopeVelocitySens = data[0x42];
  tone.pitchEnvelopeVelocityTime1 = data[0x43];
  tone.pitchEnvelopeVelocityTime4 = data[0x44];
  tone.pitchEnvelopeTimeKeyfollow = data[0x45];
  tone.pitchEnvelopeTime = [data[0x46],data[0x47], data[0x48],data[0x49]];
  tone.pitchEnvelopeLevel = [data[0x4a],data[0x4b], data[0x4c],data[0x4d]];
  tone.pitchLfo1Depth = data[0x4e];
  tone.pitchLfo2Depth = data[0x4f];

  tone.filterType = data[0x50];
  tone.cutoffFrequency = data[0x51];
  tone.cutoffKeyfollow = data[0x52];
  tone.resonance = data[0x53];
  tone.resonanceVelocitySens = data[0x54];
  tone.filterEnvelopeDepth = data[0x55];
  tone.filterEnvelopeVelocityCurve = data[0x56];
  tone.filterEnvelopeVelocitySens = data[0x57];
  tone.filterEnvelopeVelocityTime1 = data[0x58];
  tone.filterEnvelopeVelocityTime4 = data[0x59];
  tone.filterEnvelopeTimeKeyfollow = data[0x5a];
  tone.filterEnvelopeTime = [data[0x5b],data[0x5c], data[0x5d],data[0x5e]];
  tone.filterEnvelopeLevel = [data[0x5f],data[0x60], data[0x61],data[0x62]];
  tone.filterLfo1Depth = data[0x4e];
  tone.filterLfo2Depth = data[0x4f];

  tone.level = data[0x65];
  tone.biasDirection = data[0x66];
  tone.biasPosition = data[0x67];
  tone.biasLevel = data[0x68];
  tone.levelEnvelopeVelocityCurve = data[0x69];
  tone.levelEnvelopeVelocitySens = data[0x6a];
  tone.levelEnvelopeVelocityTime1 = data[0x6b];
  tone.levelEnvelopeVelocityTime4 = data[0x6c];
  tone.levelEnvelopeTimeKeyfollow = data[0x6d];
  tone.levelEnvelopeTime = [data[0x6e],data[0x6f], data[0x70],data[0x71]];
  tone.levelEnvelopeLevel = [data[0x72],data[0x73], data[0x74]];
  tone.levelLfo1Depth = data[0x75];
  tone.levelLfo2Depth = data[0x76];
  tone.pan = data[0x77];
  tone.panKeyfollow = data[0x78];
  tone.randomPanDepth = data[0x79];
  tone.alternatePanDepth = data[0x7a];
  tone.panLfo1Depth = data[0x7b];
  tone.panLfo1Depth = data[0x7c];

  tone.outputAssign = data[0x7d];
  tone.mixEfxSendLevel = data[0x7e];
  tone.chorusSendLevel = data[0x7f];
  tone.reverbSendLevel = data[0x80];

  console.log(JSON.stringify(tone));
}

function parse_common(data) {
  console.log("parse common");
  var common = {};
  data = data.slice(9, -1);

  common.name = "";
  for (i=0; i<12; i++)
     common.name += String.fromCharCode(data[0+i]);

  common.efxType = data[12];
  common.efxParams = [];
  for (i=0; i<12; i++)
    common.efxParams.push(data[13+i]);

  common.efxOutputAssign = data[0x19];
  common.efxMixOutSendLevel = data[0x1a];
  common.efxChorusSendLevel = data[0x1b];
  common.efxReverbSendLevel = data[0x1c];
  common.efxControlSource1 = data[0x1d];
  common.efxControlDepth1 = data[0x1e];
  common.efxControlSource2 = data[0x1f];
  common.efxControlDepth2 = data[0x20];
  common.chorusLevel = data[0x21];
  common.chorusRate = data[0x22];
  common.chorusDepth = data[0x23];
  common.chorusPreDelay = data[0x24];
  common.chorusFeedback = data[0x25];
  common.chorusOutput = data[0x26];
  common.reverbType = data[0x27];
  common.reverbLevel = data[0x28];
  common.reverbTime = data[0x29];
  common.reverbHFDamp = data[0x2a];
  common.delayFeedback = data[0x2b];
  common.patchTempo = [ data[0x2c], data[0x2d] ];
  common.patchLevel = data[0x2e];
  common.patchPan = data[0x2f];
  common.analogFeel = data[0x30];
  common.bendRangeUp = data[0x31];
  common.bendRangeDown = data[0x32];
  common.keyAssignMode = data[0x33];
  common.soloLegato = data[0x34];
  common.portamentoSwitch = data[0x35];
  common.portamentoMode = data[0x36];
  common.portamentoType = data[0x37];
  common.portamentoStart = data[0x38];
  common.portamentoTime = data[0x39];
  common.patchControlSource2 = data[0x3a];
  common.patchControlSource3 = data[0x3b];
  common.efxControlHoldPeak = data[0x3c];
  common.controlHoldPeak = [data[0x3d],data[0x3e], data[0x3f]];
  common.velocityRangeSwitch = data[0x40];
  common.octaveShift = data[0x41];
  common.stretchTuneDepth = data[0x42];
  common.voicePriority = data[0x43];

  common.structureType1and2 = data[0x44];
  common.booster1and2 = data[0x45];
  common.structureType1and2 = data[0x46];
  common.booster1and2 = data[0x47];

  common.clockSource = data[0x48];
  common.patchCategory = data[0x49];
  
  console.log(JSON.stringify(common));
}

function read_patch() {

  // common
  sendSYSEXwithRolandChecksum_JV([0xf0, 0x41, 
    deviceId,   // device ID
    modelId, // model ID JV-1010
    0x11, // cmd -> RQ1
    0x03, 0x00, 0x00, 0x00, // addr
    0x00, 0x00, 0x00, 0x4a, // size
    0x00, // checksum
    0xf7
      ]);

  // tone 1
  sendSYSEXwithRolandChecksum_JV([0xf0, 0x41, 
    deviceId,   // device ID
    modelId, // model ID JV-1010
    0x11, // cmd -> RQ1
    0x03, 0x00, 0x10, 0x00, // addr
    0x00, 0x00, 0x01, 0x01, // size
    0x00, // checksum
    0xf7
      ]);

  // tone 2
  sendSYSEXwithRolandChecksum_JV([0xf0, 0x41, 
    deviceId,   // device ID
    modelId, // model ID JV-1010
    0x11, // cmd -> RQ1
    0x03, 0x00, 0x12, 0x00, // addr
    0x00, 0x00, 0x01, 0x01, // size
    0x00, // checksum
    0xf7
      ]);

  // tone 3
  sendSYSEXwithRolandChecksum_JV([0xf0, 0x41, 
    deviceId,   // device ID
    modelId, // model ID JV-1010
    0x11, // cmd -> RQ1
    0x03, 0x00, 0x14, 0x00, // addr
    0x00, 0x00, 0x01, 0x01, // size
    0x00, // checksum
    0xf7
      ]);

  // tone 4
  sendSYSEXwithRolandChecksum_JV([0xf0, 0x41, 
    deviceId,   // device ID
    modelId, // model ID JV-1010
    0x11, // cmd -> RQ1
    0x03, 0x00, 0x16, 0x00, // addr
    0x00, 0x00, 0x01, 0x01, // size
    0x00, // checksum
    0xf7
      ]);

  // patch common 00 00 -  (size = 0x4a)
  // patch tone 1 10 00 -  (size=0x0101)
  // patch tone 2 12 00 -  (size=0x0101)
  // patch tone 3 14 00 -  (size=0x0101)
  // patch tone 4 16 00 -  (size=0x0101)


  
  //read_param([0x03, 0x00, 0x00, 0x00], 12, "name");
}

function write_bank() {

  // tone 4
  sendSYSEXwithRolandChecksum_JV([0xf0, 0x41, 
    deviceId,   // device ID
    modelId, // model ID JV-1010
    0x11, // cmd -> RQ1
    0x03, 0x00, 0x16, 0x00, // addr
    0x00, 0x00, 0x01, 0x01, // size
    0x00, // checksum
    0xf7
      ]);
}

function read_param(address, sz, name) {
  sendSYSEXwithRolandChecksum_JV([0xf0, 0x41, 
    deviceId,   // device ID
    modelId, // model ID JV-1010
    0x11, // cmd -> RQ1
    address[0], address[1], address[2], address[3], // addr
    0x00, 0x00, 0x00, 12, // size
    0x00, // checksum
    0xf7
      ]);
}

// This is the kick-off function that builds
// the entire script. It collects all banks that are available
// building a giant database, then writes out the database 
// in a Cubase-friendly fashion.
function build_script() {
  g_tones = [];
  g_bank_index = 0;
  var bank = g_bank_collection_fns[g_bank_index];
  
  document.getElementById('s1').innerText = ("collecting "+bank.eng+" "+bank.type);

  bank.fn();
}

function collect_next_bank() {
  if (g_bank_index == -1 )
    return;

  g_bank_index++;
  var bank = g_bank_collection_fns[g_bank_index];
  if (bank != undefined) {
    t = ("collecting "+bank.eng+" -- "+bank.type);
    console.log(t)
    document.getElementById('s1').innerText = t;
    bank.fn();
  } else {
    console.log("complete!");
    document.getElementById('s1').innerText = "";
    document.getElementById('s2').innerText = "";
    document.getElementById('s3').innerText = "Complete! File has been downloaded";

    generate_patch_script();
  } 
}



var categories = [
 "No Assign", // 0
 "Ac.Piano",
 "Ac.Piano",
 "",
 "Ac.Piano",
 "E.Piano",
 "Organ",
 "Organ",
 "",
 "Other Keyboards",
 "Other Keyboards", // 10
 "Other Keyboards",
 "Accordian/Harmonica",
 "Accordian/Harmonica",
 "Bell/Mallet",
 "Bell/Mallet",
 "Ac.Guitar",
 "E.Guitar",
 "Dist.Guitar",
 "Ac.Bass",
 "E.Bass", //20
 "Synth Bass",
 "Plucked/Stroke", 
 "Strings",
 "Strings",
 "Strings",
 "Brass",
 "Brass",
 "Wind",
 "Flute",
 "Sax", //30
 "",
 "Vox/Choir",
 "Vox/Choir",
 "Synth Lead",
 "Synth Brass",
 "Synth Pad/Strings",
 "Synth Bellpad",
 "Synth PolyKey",
 "FX",
 "Synth Seq/Pop", //40
 "",
 "Pulsating",
 "Beat & Groove",
 "Hit",
 "Sound FX",
 "Drums",
 "Percussion",
 "",
 "",
 "", // 50
 "DrumKit",
 "",
 "",
 "",
 "",
 "",
 "",
 "",
 "",
 "", //60
 "",
 "",
 "",
 "",
 "",
 "",
 "",
 "Drums",
 "",
 "", //70
 "",
 "DrumKit",
 "",
 "DrumKit",
 "",
 "",
 "",
 "",
 "DrumKit",
 "DrumKit", //80
 "",
 "DrumKit",
 "DrumKit",
 "DrumKit",
 "",
 "",
 "DrumKit",
 "DrumKit",
 "",
 "", //90

];



var g_lsb_range;
var g_lsb;
var g_msb;
var g_pc_range;
var g_pc;
var g_instr_type;
var g_cat_offset;
var g_patch_name;
var g_bank_timeout_id = undefined;

var total_tones = 0;

/*
SN-A
 BANK SELECT     | PROGRAM   | GROUP                      | NUMBER
 MSB | LSB       | NUMBER    |                            | 
-----+-----------+-----------+----------------------------+-------------
 089 | 000 - 001 | 001 - 128 | User SN Acoustic Tone      | 0001 - 0256
-----+-----------+-----------+----------------------------+-------------
 089 | 064 - 065 | 001 - 128 | Preset SN Acoustic Tone    | 0001 - 0256
*/
function collectSNA_Preset(){
  collect_bank([89,89],[64,65],[0,127],'sna');
}
function collectSNA_User(){
  collect_bank([89,89],[0,1],[0,127],'sna');
}



/*
SN-S
 BANK SELECT     | PROGRAM   | GROUP                      | NUMBER
 MSB | LSB       | NUMBER    |                            | 
-----+-----------+-----------+----------------------------+-------------
 095 | 000 - 003 | 001 - 128 | User SN Synth Tone         | 0001 - 0512
-----+-----------+-----------+----------------------------+-------------
 095 | 064       | 001 - 128 | Preset SN Synth Tone       | 0001 - 0128
     | :         | :         |                            | : 
 095 | 072       | 001 - 085 |                            | 1025 - 1109
*/
function collectSNS_Preset() {
  collect_bank([95,95],[64,72],[0,127],'sns');
}
function collectSNS_User() {
  collect_bank([95,95],[0,3],[0,127],'sns');
}

/*
 SN-D
 BANK SELECT     | PROGRAM   | GROUP                      | NUMBER
 MSB | LSB       | NUMBER    |                            | 
-----+-----------+-----------+----------------------------+-------------
 088 | 000       | 001 - 064 | User SN Drum Kit           | 0001 - 0064
-----+-----------+-----------+----------------------------+-------------
 088 | 064       | 001 - 026 | Preset SN Drum Kit         | 0001 - 0026
*/
function collectSND_Preset() {
  collect_bank([88,88],[64,64],[0,25],'snd');
}
function collectSND_User() {
  collect_bank([88,88],[0,0],[0,63],'snd');
}

/*
 PCM-S
 BANK SELECT     | PROGRAM   | GROUP                      | NUMBER
 MSB | LSB       | NUMBER    |                            | 
-----+-----------+-----------+----------------------------+-------------
 087 | 000 - 001 | 001 - 128 | User PCM Synth Tone        | 0001 - 0256
-----+-----------+-----------+----------------------------+-------------
 087 | 064 - 070 | 001 - 128 | Preset PCM Synth Tone      | 0001 - 0896
-----+-----------+-----------+----------------------------+-------------
 121 | 000 -     | 001 - 128 | GM2 Tone                   | 0001 - 0256
*/
function collectPCMS_Preset() {
  collect_bank([87,87],[64,70],[0,127],'pcms');
}
function collectPCMS_User() {
  collect_bank([87,87],[0,1],[0,127],'pcms');
}

/*
 PCM-DRUM
 BANK SELECT     | PROGRAM   | GROUP                      | NUMBER
 MSB | LSB       | NUMBER    |                            | 
-----+-----------+-----------+----------------------------+-------------
 086 | 000       | 001 - 032 | User PCM Drum Kit          | 0001 - 0032
-----+-----------+-----------+----------------------------+-------------
 086 | 064       | 001 - 014 | Preset PCM Drum Kit        | 0001 - 0014
-----+-----------+-----------+----------------------------+-------------
 120 | 000       | 001 - 057 | GM2 Drum Kit               | 0001 - 0009

*/
function collectPCMD_Preset() {
  collect_bank([86,86], [64,64], [0,13], 'pcmd');
}
function collectPCMD_User() {
  collect_bank([86,86], [0,0], [0,31], 'pcmd');
}


/*
BANK SELECT | PROGRAM | GROUP | NUMBER
MSB|LSB |NUMBER | | -----+-----------+-----------+----------------------------+-------------
093 | 000 | 001 - 041 | Expansion PCM Tone (SRX01) | 0001 - 0041
092 | 000 | 001 - 079 | Expansion PCM Drum (SRX01) | 0001 - 0079
*/
function collectSRX01_Tone() {
  collect_bank([93,93], [0,0],[0,40],'pcms');
}
function collectSRX01_Drum() {
  collect_bank([92,92], [0,0],[0,78],'pcmd');
}
/*
BANK SELECT | PROGRAM | GROUP | NUMBER
MSB |LSB  | NUMBER    | | -----+-----------+-----------+----------------------------+-------------
093 | 001 | 001 - 050 | Expansion PCM Tone (SRX02) | 0001 - 0050
*/
function collectSRX02_Tone() {
  collect_bank([93,93], [1,1],[0,49],'pcms');
}
/*
BANK SELECT | PROGRAM | GROUP | NUMBER
MSB |LSB  | NUMBER    | | -----+-----------+-----------+----------------------------+-------------
093 | 002 | 001 - 128 | Expansion PCM Tone (SRX03) | 0001 - 0128 
092 | 002 | 001 - 012 | Expansion PCM Drum (SRX03) | 0001 - 0012
*/
function collectSRX03_Tone() {
  collect_bank([93,93], [2,2],[0,127],'pcms');
}
function collectSRX03_Drum() {
  collect_bank([92,92], [2,2],[0,11],'pcmd');
}
/*
BANK SELECT | PROGRAM | GROUP | NUMBER
MSB |LSB  | NUMBER    | | -----+-----------+-----------+----------------------------+-------------
093 | 003 | 001 - 128 | Expansion PCM Tone (SRX04) | 0001 - 0128
*/
function collectSRX04_Tone() {
  collect_bank([93,93], [3,3],[0,127],'pcms');
}
/*
093 | 004 | 001 - 128 | Expansion PCM Tone (SRX05) | 0001 - 0128
    |:    | :         |                            | :
    | 006 | 001 - 056 |                            | 0257-0312 
092 | 004 | 001 - 034 | Expansion PCM Drum (SRX05) | 0001 - 0034
*/
function collectSRX05_Tone() {
  collect_bank([93,93],[4,6],[0,127],'pcms');
}
function collectSRX05_Drum() {
  collect_bank([92,92],[2,2],[0,11],'pcmd');
}
/*
093 | 007 | 001 - 128 | Expansion PCM Tone (SRX06) | 0001 - 0128 
    | :   | :         |                            |:
    | 010 | 001-065   |                            |0385-0449 
092 | 007 | 001 - 005 | Expansion PCM Drum (SRX06) | 0001 - 0005
*/
function collectSRX06_Tone() {
  collect_bank([93,93],[7,10],[0,127],'pcms');
}
function collectSRX06_Drum() {
  collect_bank([92,92],[7,7],[0,4],'pcmd');
}
/*
093 | 011 | 001 - 128 | Expansion PCM Tone (SRX07) | 0001 - 0128 
    | :   |  :        |                            | :
    | 014 |001-091    |                            | 0385-0475 
092 | 011 | 001 - 011 | Expansion PCM Drum (SRX07) | 0001 - 001
*/
function collectSRX07_Tone() {
  collect_bank([93,93],[11,14],[0,127],'pcms');
}
function collectSRX07_Drum() {
  collect_bank([92,92],[11,11],[0,10],'pcmd');
}
/*
93  | 015 | 001 - 128 | Expansion PCM Tone (SRX08)  | 0001 - 0128 
    |  :  | :         |                             | :
    |018  | 001-064   |                             | 0385-0448 
092 | 015 | 001 - 021 | Expansion PCM Drum (SRX08) | 0001 - 0021
*/
function collectSRX08_Tone() {
  collect_bank([93,93],[15,18],[0,127],'pcms');
}
function collectSRX08_Drum() {
  collect_bank([92,92],[15,15],[0,20],'pcmd');
}
/*
093  | 019 | 001 - 128 | Expansion PCM Tone (SRX09) | 0001 - 0128 
     |:    |:          |                            |  :
     | 022 | 001-030   |                            | 0385-0414 
092  | 019 | 001 - 012 | Expansion PCM Drum (SRX09) | 0001 - 001
*/
function collectSRX09_Tone() {
  collect_bank([93,93],[19,22],[0,127],'pcms');
}
function collectSRX09_Drum() {
  collect_bank([92,92],[19,19],[0,11],'pcmd');
}
/*
093 | 023 | 001 - 100 | Expansion PCM Tone (SRX10) | 0001 - 0100
*/
function collectSRX10_Tone() {
  collect_bank([93,93],[23,23],[0,99],'pcms');
}
/*
093 | 024 | 001 - 042 | Expansion PCM Tone (SRX11) | 0001 - 0042
*/
function collectSRX11_Tone() {
  collect_bank([93,93],[24,24],[0,41],'pcms');
}
/*
093 | 026 | 001 - 050 | Expansion PCM Tone (SRX12) | 0001 - 0050
*/
function collectSRX12_Tone() {
  collect_bank([93,93],[26,26],[0,49],'pcms');
}

/*
089  |096        |001-017    |ExpansionSNTone(ExSN1)      |0001-0017 
-----+-----------+-----------+----------------------------+------------- 
089  |097        |001-017    |ExpansionSNTone(ExSN2)      |0001-0017 
-----+-----------+-----------+----------------------------+------------- 
089  |098        |001-050    |ExpansionSNTone(ExSN3)      |0001-0050 
-----+-----------+-----------+----------------------------+------------- 
089  |099        |001-012    |ExpansionSNTone(ExSN4)      |0001-0012 
-----+-----------+-----------+----------------------------+------------- 
089  |100        |001-012    |ExpansionSNTone(ExSN5)      |0001-0012 
-----+-----------+-----------+----------------------------+------------- 
088  |101        |001-007    |ExpansionSNDrum(ExSN6)      |0001-0007 
*/
function collect_EXSN1() {
  collect_bank([89,89], [96,96],[0,16],'sna');
}
function collect_EXSN2() {
  collect_bank([89,89], [97,97],[0,16],'sna');
}
function collect_EXSN3() {
  collect_bank([89,89], [98,98],[0,49],'sna');
}
function collect_EXSN4() {
  collect_bank([89,89], [99,99],[0,11],'sna');
}
function collect_EXSN5() {
  collect_bank([89,89], [100,100],[0,11],'sna');
}
function collect_EXSN6() {
  collect_bank([88,88], [101,101],[0,6],'snd');
}

/*
-----+-----------+-----------+----------------------------+------------- 
097  | 000       | 001 - 128 | Expansion PCM Tone (ExPCM) | 0001 - 0128
     | :         |  :        |                            | :
     | 003       | 001 - 128 |                            | 0385 - 0512 
096  | 000       | 001 - 019 | Expansion PCM Drum (ExPCM) | 0001 - 0019
-----+-----------+-----------+----------------------------+------------- 
121  | 000 -     | 001 - 128 | Expansion GM2 Tone (GM2#)  | 0001 - 0256 
120  | 000       | 001-057   |ExpansionGM2Drum(GM2#)      | 0001 - 0009
*/
function collect_ExPCM_Tone() {
  collect_bank([97,97],[0,3],[0,127],'expcm');
}
function collect_ExPCM_Drum() {
  collect_bank([96,96],[0,0],[0,127],'pcmd');
}
function collect_GM2_Tone() {
  collect_bank([121,121],[0,0],[0,127],'pcms');
}
function collect_GM2_Drum() {
  collect_bank([120,120],[0,0],[0,56],'pcmd');
}



// This is general function can kicks off a bank read
// over a range of values. the 'parseType' indicates how 
// the sysex payload is parsed to get the result.
function collect_bank(msb_range, lsb_range, pc_range, instrType) {
  g_msb_range = msb_range;
  g_msb = msb_range[0];
  g_lsb_range = lsb_range;
  g_lsb = lsb_range[0];
  g_pc_range = pc_range;
  g_pc = pc_range[0];
  g_instr_type = instrType;
  load_part(g_msb, g_lsb, g_pc);
  read_name(g_instr_type);

  // start a timeout -- if the message does not come back,
  // then this bank is not available.
  g_bank_timeout_id = setTimeout(bank_timeout, 1000);
}

function bank_timeout() {
  clearTimeout(g_bank_timeout_id);
  g_bank_timeout_id = undefined;

  console.log("*** BANK NOT AVAILABLE ***");
  collect_next_bank();
}
// ------------------------------------------------------------------------


g_next_midi_callback_fn = function(event) {

  var category;

  if (event.data.length == 12+13) {
    // This is the name of the patch
    total_tones ++;
    g_patch_name = String.fromCharCode.apply(null, event.data.subarray(11, 23));

  } else {
    // this is the category.
    category = event.data[11] & 0x7f;

    if (g_patch_name != "<<No media>>" && g_patch_name != "INIT TONE   "
              && g_patch_name != "INIT KIT    ") {
      //console.log(g_msb+" "+g_lsb+" "+g_pc+" '"+g_patch_name+"' cat="+category+" "+categories[category]);
      document.getElementById('s3').innerText = 
          g_msb+" "+g_lsb+" "+g_pc+" '"+g_patch_name+"' cat="+category+" "+categories[category]

      var t = {};
      t.name = g_patch_name;
      t.msb = g_msb;
      t.lsb = g_lsb;
      t.pc = g_pc;
      t.cat = category;
      t.catName = categories[category];
      g_tones.push(t);
      document.getElementById('s2').innerText = g_tones.length + " Tones"


      // TODO : LOAD SOUND INTO DATABASE
      // g_msb g_lsb g_pc g_patch_name g_category
    }

    g_pc++;
    if (g_pc > g_pc_range[1]) {
      g_pc = g_pc_range[0];
      // now update lsb.
      g_lsb++;
      if (g_lsb > g_lsb_range[1]) {
        g_lsb = g_lsb_range[0];
        // now update msb.
        g_msb++;
        if (g_msb > g_msb_range[1]) {
          // we're done.
          g_msb=-1
        }
      }
    }
  
    if (g_msb >= 0) {
      // continue...
      load_part(g_msb, g_lsb, g_pc);
      read_name(g_instr_type);
    } else {
      // TODO : we are DONE with this bank.
      console.log("**** BANK DONE ****");
      document.getElementById('s3').innerText = "**** Bank Done ****";
      collect_next_bank();
    }
  }

};



function load_part(msb, lsb, pc) {
  var ch = 0;
  midiOut.send([0xb0|ch, 0x00, msb]);
  midiOut.send([0xb0|ch, 0x20, lsb]);
  midiOut.send([0xc0|ch, pc]);
}



// Different sound sources store their name and category
// at different offsets into the payload. 
function read_name(engineName) {
  // We're going to read memory from the Integra using sysex.
  // 19 00 00 00 | Temporary Tone (Part 1) 
  // based on what the engine is, the contents will be at 
  // different addresses:
  // 00 00 00 | Temporary PCM Synth Tone |
  // 01 00 00 | Temporary SuperNATURAL Synth Tone |
  // 02 00 00 | Temporary SuperNATURAL Acoustic Tone |
  // 03 00 00 | Temporary SuperNATURAL Drum Kit |
  // 10 00 00 | Temporary PCM Drum Kit

  if (engineName == "sna") {
    // 19 02 00 00

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x02, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x02, 0x00, 0x1b, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);

  } else

  if (engineName == "sns") {
    // 19 01 00 00

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x01, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x01, 0x00, 0x36, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);
  } else

  if (engineName == "snd") {
    // 19 03 00 00

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x03, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x03, 0x00, 0x0c, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);
  } else

  if (engineName == "pcms") {
    // 19 00 00 00

    /*
    | 00 00 00 | PCM Synth Tone Common (0x50 80b)
    | 00 02 00 | PCM Synth Tone Common MFX (0x01 0x11) 273
    | 00 10 00 | PCM Synth Tone PMT (Partial Mix Table) (0x29) 41
    | 00 20 00 | PCM Synth Tone Partial (Partial 1) (01 1a) 282
    | 00 22 00 | PCM Synth Tone Partial (Partial 2) (01 1a) 282
    | 00 24 00 | PCM Synth Tone Partial (Partial 3) (01 1a) 282
    | 00 26 00 | PCM Synth Tone Partial (Partial 4) (01 1a) 282
    | 00 30 00 | PCM Synth Tone Common 2 (0x3c) 60
    -> 1582 b total 06 2e
    */

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x00, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x00, 0x30, 0x10, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);
  } else

  if (engineName == "pcmd") {
    // 19 10 00 00

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x10, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x10, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);
  } 
  else 
  if (engineName == "expcm") {
    // 19 00 00 00

    // Note these sounds can't be edited so they 
    // can't be read out?

    /*
    | 00 00 00 | PCM Synth Tone Common (0x50 80b)
    | 00 02 00 | PCM Synth Tone Common MFX (0x01 0x11) 273
    | 00 10 00 | PCM Synth Tone PMT (Partial Mix Table) (0x29) 41
    | 00 20 00 | PCM Synth Tone Partial (Partial 1) (01 1a) 282
    | 00 22 00 | PCM Synth Tone Partial (Partial 2) (01 1a) 282
    | 00 24 00 | PCM Synth Tone Partial (Partial 3) (01 1a) 282
    | 00 26 00 | PCM Synth Tone Partial (Partial 4) (01 1a) 282
    | 00 30 00 | PCM Synth Tone Common 2 (0x3c) 60
    -> 1582 b total 06 2e
    */

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x00, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x00, 0x30, 0x10, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);

  } else {
    console.log("Read name ... unknown type "+engineName);
  }

}

// --- MIDI utilities --

// DataRequest RQ1
// f0 41 10 [00 00 64] 11 a1 a2 a3 a4 s1 s2 s3 s4 CK f7

// DataSet DT1
// f0 41 10 [00 00 64] 12 a1 a2 a3 a4 d0 .. dn CK f7

// 

function sendSYSEXwithRolandChecksum_JV(msg) {
	// the message is complete we just need to insert the checksum
  sum = msg[5]+msg[6]+msg[7]+msg[8]+
      msg[9]+msg[10]+msg[11]+msg[12];
  checksum = 128-(sum % 128);
  msg[13] = checksum;
  midiOut.send(msg);
}

function sendSYSEXwithRolandChecksum(msg) {
  // the message is complete we just need to insert the checksum
  sum = msg[7]+msg[8]+msg[9]+msg[10]+
      msg[11]+msg[12]+msg[13]+msg[14];
  checksum = 128-(sum % 128);
  msg[15] = checksum;
  midiOut.send(msg);
}

function printArrayHex(arr) {
  var s = "";
  for (var i=0; i<arr.length; i++) {
    s += arr[i].toString(16) + " ";
  }
  console.log(s);
  s = "";
  for (var i=0; i<arr.length; i++) {
    s += String.fromCharCode(arr[i]);
  }
  console.log(s);
}

function onSuccessCallback(access) {
  midi = access;
  selectMIDIIn = document.getElementById("midiIn");
  selectMIDIOut = document.getElementById("midiOut");

  let 
    inputs = midi.inputs,
    outputs = midi.outputs;

  inputs.forEach((port) => {
    selectMIDIIn.options.add(new Option(port.name, port.fingerprint, false, false));
  });
  selectMIDIIn.onchange = changeMIDIIn;
  //selectMIDIIn.selectedIndex = 1;

  outputs.forEach((port) => {
    selectMIDIOut.options.add(new Option(port.name, port.fingerprint, false, false));
  });
  selectMIDIOut.onchange = changeMIDIOut;
  //selectMIDIOut.selectedIndex = 1;
}

function changeMIDIIn(event) {
  let
    inputs = midi.inputs,
    selectedIndex = event.target.selectedIndex - 1;

    midiIn = undefined;
    inputs.forEach((port) => {
      if (selectedIndex == 0) {
        port.onmidimessage = midiMessageReceived;
        midiIn = port;
        console.log("connected to "+port.name);
      } else {
        port.onmidimessage = undefined;
      }
      selectedIndex--;
    });
}

function changeMIDIOut(event) {
  let
    outputs = midi.outputs,
    selectedIndex = event.target.selectedIndex - 1;

  midiOut = undefined;
  outputs.forEach((port) => {
    if (selectedIndex == 0) {
      midiOut = port;
      console.log("connected OUTPUT to " + port.name);
    }
    selectedIndex--;
  });
}

function onMIDIFailCallback(err) {
  console.log("WebMIDI failed to initialize: " + err.code);
  document.getElementById('midiFailed').style.display='block';
}