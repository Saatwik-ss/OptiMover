"""
Connect Four CNN Model
A convolutional neural network that evaluates Connect Four board positions
and predicts win probability for the current player
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class ConnectFourCNN(nn.Module):
    def __init__(self):
        super(ConnectFourCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.fc1 = nn.Linear(64 * 6 * 7, 128)
        self.fc2 = nn.Linear(128, 1)  # Output is a logit for player1 win probability
        self.relu = nn.ReLU()
        
    def forward(self, x):
        # x shape: (batch, 6, 7)
        x = x.unsqueeze(1)  # (batch, 1, 6, 7)
        x = self.relu(self.conv1(x))
        x = self.relu(self.conv2(x))
        x = x.view(x.size(0), -1)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x
