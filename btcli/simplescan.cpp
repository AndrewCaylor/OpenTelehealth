#include <stdio.h>
// POSIX sys lib: fork, pipe, I/O (read, write)
#include <unistd.h>
// superset of unistd, same
#include <stdlib.h>

// Bluetooth
#include <bluetooth/bluetooth.h>
#include <bluetooth/rfcomm.h>
#include <bluetooth/hci.h>
#include <bluetooth/hci_lib.h>
#include <bluetooth/sdp.h>
#include <bluetooth/sdp_lib.h>
#include <bluetooth/sco.h>

#include <stdio.h>
#include <signal.h>
#include <stdlib.h>

// socket
#include <sys/socket.h>
#include <sys/ioctl.h>

// c++
#include <string>
#include <vector>
#include <iostream>

// my protocol
#include <bttypes.hpp>

/**
 * @brief Check if there is data available on the socket
*/
bool isready(int socket, bool text = false)
{
  fd_set rfds;
  FD_ZERO(&rfds);
  FD_SET(socket, &rfds);
  struct timeval tv;
  tv.tv_sec = 0;
  tv.tv_usec = 5;

  int retval = select(socket + 1, &rfds, nullptr, nullptr, &tv);
  if (retval == -1)
  {
    if (text)
      perror("select()");
  }
  else if (retval)
  {
    if (text)
      printf("Data is available now.\n");
    return true;
  }
  else
  {
    if (text)
      printf("No data within five seconds.\n");
  }
  return false;
}

/**
 * @brief Read bluetooth response from IOT device
 * 
*/
std::string readBTRes(int socket)
{
  std::vector<char> packet = {};
  while (isready(socket))
  {
    int bytes = 100; // this is arbitrary
    char buffer[100 + 1] = {0};

    read(socket, &buffer, bytes);

    for (int i = 0; i < 100; i++)
    {
      packet.push_back(buffer[i]);
    }
  }

  if (packet.size() > sizeof(recordRes))
  {
    char *buf = new char[sizeof(recordRes)];
    std::copy(packet.begin(), packet.begin() + (int)sizeof(recordRes), buf);

    recordRes res;
    memcpy(&res, buf, sizeof(recordRes));

    char *data = new char[packet.size() - sizeof(recordRes)];
    std::copy(packet.begin() + (int)sizeof(recordRes), packet.end(), data);

    std::cout << res.bitsprecision << "\n";
    std::cout << res.durationms << "\n";
    std::cout << res.length << "\n";
    std::cout << res.samplerate << "\n";
    return data;
  }

  return "";
}

/**
 * @brief Write bluetooth request to IOT device
 * 
*/
int sendBTReq(int socket, recordReq req){
  char *buf = new char[sizeof(recordReq)];
  memcpy(buf, &req, sizeof(recordReq));
  int status = write(socket, buf, sizeof(recordReq));
  return status;
}


int main(int argc, char **argv)
{
  int flag = 0;

  struct sockaddr_rc addrress = {0};
  int s, status;

  char dest[18] = ""; // = "B0:10:41:3F:6E:80";//My destination address Laptop
  char namelaptop[20] = "ECG Transponder";

  // allocate a socket
  s = socket(AF_BLUETOOTH, SOCK_STREAM, BTPROTO_RFCOMM);
  /// create a socket

  // set the connection parameters (who to connect to)
  addrress.rc_family = AF_BLUETOOTH;
  addrress.rc_channel = (uint8_t)1; // must use sdp to work in real devices
  // may this channel not ready

  printf("Search for BT Devices...\n");

  /// search

  inquiry_info *ii = nullptr;
  int max_rsp, num_rsp;
  int dev_id, sock, len, flags;
  int i;

  char addr[18] = {0};
  char name[248] = {0};

  dev_id = hci_get_route(nullptr);
  sock = hci_open_dev(dev_id);
  if (dev_id < 0 || sock < 0)
  {
    perror("opening socket");
    exit(1);
  }

  len = 8;
  max_rsp = 2;
  flags = IREQ_CACHE_FLUSH;
  ii = (inquiry_info *)malloc(max_rsp * sizeof(inquiry_info));

  num_rsp = hci_inquiry(dev_id, len, max_rsp, nullptr, &ii, flags);
  if (num_rsp < 0)
  {
    perror("hci_inquiry");
  }

  for (i = 0; i < num_rsp; i++)
  {
    ba2str(&(ii + i)->bdaddr, addr);
    memset(name, 0, sizeof(name));
    if (hci_read_remote_name(sock, &(ii + i)->bdaddr, sizeof(name),
                             name, 0) < 0)
      strcpy(name, "[unknown]");

    else
    {
      printf("\nFind #%d\n", i);

      printf("Addr:%s    Name:%s\n", addr, name);

      int a = strcmp(name, namelaptop);
      // printf("compare:%d\n",a);

      if (!a)
      {                                    // if name mached
        str2ba(addr, &addrress.rc_bdaddr); // copy dest-->addr.rc_bdaddr
        flag = 1;
      }
    }
  }

  /// End Search

  /// Connect and send

  if (flag == 0)
  {
    printf("Not find dest: %s\n", name);
    exit(0);
  }

  // connect to server, throw socket s
  status = connect(s, (struct sockaddr *)&addrress, sizeof(addrress));
  // successful, connect() returns 0.

  printf("connection status: %d\n\n", status); // 0 show OK

  // send a message to server
  if (status == 0)
  {
    printf("press x to exit\n");
    while (true)
    {
      std::string readData = readBTRes(s);
      if (readData != "")
      {
        std::cout << readData << "\n";
      }
      else{
        std::cout << "No data\n";
      }

      recordReq req;
      req.bitsprecision = 5;
      req.durationms = 2;
      req.samplerate = 3;

      status = sendBTReq(s, req);
      if (status == sizeof(recordReq))
      {
        printf("Send data to server done\n");
      }
      else
      {
        printf("failed to write\n");
      }
      sleep(1);
    }
  }

  std::cout << "Closing socket\n";

  /// close the socket
  close(s);

  /// End connect and send

  free(ii);
  close(sock);

  return 0;
}