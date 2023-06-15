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

#include <string>
#include <iostream>

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

std::string readBT(int socket)
{
  std::string out = "";
  while (isready(socket))
  {
    int bytes = 100; //this is arbitrary
    char buffer[100 + 1] = {0};

    read(socket, &buffer, bytes);
    
    std::string str(buffer);

    out += str;
  }
  return out;
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
  printf("socket num %i\n", s);
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
      std::string readData = readBT(s);
      if (readData != "")
      {
        std::cout << readData << "\n";
      }

      status = write(s, "hello!", 6);
      if (status == 6)
      {
        printf("Send data to server done\n");
      }
      else
      {
        printf("failed to write");
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