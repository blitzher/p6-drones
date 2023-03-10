/**
Copyright 2017 Rafael Muñoz Salinas. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY Rafael Muñoz Salinas ''AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Rafael Muñoz Salinas OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those of the
authors and should not be interpreted as representing official policies, either expressed
or implied, of Rafael Muñoz Salinas.
*/

//Dictionary extracted from https://sourceforge.net/projects/aruco/files/3.1.12/

var AR = this.AR || require('../aruco').AR;
AR.DICTIONARIES['APRILTAG_25h7'] = {
  nBits: 25,
  tau: 7,
  codeList: [0x4b770d,0x11693e6,0x1a599ab,0xc3a535,0x152aafa,0xaccd98,0x1cad922,0x2c2fad,0xbb3572,0x14a3b37,0x186524b,0xc99d4c,0x23bfea,0x141cb74,0x1d0d139,0x1670aeb,0x851675,0x150334e,0x6e3ed8,0xfd449d,0xaa55ec,0x1c86176,0x15e9b28,0x7ca6b2,0x147c38b,0x1d6c950,0x8b0e8c,0x11a1451,0x1562b65,0x13f53c8,0xd58d7a,0x829ec9,0xfaccf1,0x136e405,0x7a2f06,0x10934cb,0x16a8b56,0x1a6a26a,0xf85545,0x195c2e4,0x24c8a9,0x12bfc96,0x16813aa,0x1a42abe,0x1573424,0x1044573,0xb156c2,0x5e6811,0x1659bfe,0x1d55a63,0x5bf065,0xe28667,0x1e9ba54,0x17d7c5a,0x1f5aa82,0x1a2bbd1,0x1ae9f9,0x1259e51,0x134062b,0xe1177a,0xed07a8,0x162be24,0x59128b,0x1663e8f,0x1a83cb,0x45bb59,0x189065a,0x4bb370,0x16fb711,0x122c077,0xeca17a,0xdbc1f4,0x88d343,0x58ac5d,0xba02e8,0x1a1d9d,0x1c72eec,0x924bc5,0xdccab3,0x886d15,0x178c965,0x5bc69a,0x1716261,0x174e2cc,0x1ed10f4,0x156aa8,0x3e2a8a,0x2752ed,0x153c651,0x1741670,0x765b05,0x119c0bb,0x172a783,0x4faca1,0xf31257,0x12441fc,0xd3748,0xc21f15,0xac5037,0x180e592,0x7d3210,0xa27187,0x2beeaf,0x26ff57,0x690e82,0x77765c,0x1a9e1d7,0x140be1a,0x1aa1e3a,0x1944f5c,0x19b5032,0x169897,0x1068eb9,0xf30dbc,0x106a151,0x1d53e95,0x1348cee,0xcf4fca,0x1728bb5,0xdc1eec,0x69e8db,0x16e1523,0x105fa25,0x18abb0c,0xc4275d,0x6d8e76,0xe8d6db,0xe16fd7,0x1ac2682,0x77435b,0xa359dd,0x3a9c4e,0x123919a,0x1e25817,0x2a836,0x1545a4,0x1209c8d,0xbb5f69,0x1dc1f02,0x5d5f7e,0x12d0581,0x13786c2,0xe15409,0x1aa3599,0x139aad8,0xb09d2a,0x54488f,0x13c351c,0x976079,0xb25b12,0x1addb34,0x1cb23ae,0x1175738,0x1303bb8,0xd47716,0x188ceea,0xbaf967,0x1226d39,0x135e99b,0x34adc5,0x2e384d,0x90d3fa,0x232713,0x17d49b1,0xaa84d6,0xc2ddf8,0x1665646,0x4f345f,0x2276b1,0x1255dd7,0x16f4ccc,0x4aaffc,0xc46da6,0x85c7b3,0x1311fcb,0x9c6c4f,0x187d947,0x8578e4,0xe2bf0b,0xa01b4c,0xa1493b,0x7ad766,0xccfe82,0x1981b5b,0x1cacc85,0x562cdb,0x15b0e78,0x8f66c5,0x3332bf,0x12ce754,0x96a76,0x1d5e3ba,0x27ea41,0x14412df,0x67b9b4,0xdaa51a,0x1dcb17,0x4d4afd,0x6335d5,0xee2334,0x17d4e55,0x1b8b0f0,0x14999e3,0x1513dfa,0x765cf2,0x56af90,0x12e16ac,0x1d3d86c,0xff279b,0x18822dd,0x99d478,0x8dc0d2,0x34b666,0xcf9526,0x186443d,0x7a8e29,0x19c6aa5,0x1f2a27d,0x12b2136,0xd0cd0d,0x12cb320,0x17ddb0b,0x5353b,0x15b2caf,0x1e5a507,0x120f1e5,0x114605a,0x14efe4c,0x568134,0x11b9f92,0x174d2a7,0x692b1d,0x39e4fe,0xaaff3d,0x96224c,0x13c9f77,0x110ee8f,0xf17bea,0x99fb5d,0x337141,0x2b54d,0x1233a70]
};