"""
Connect Four CNN Model
A convolutional neural network that evaluates Connect Four board positions
and predicts win probability for the current player
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class ConnectFourCNN(nn.Module):
    """
    CNN for Connect Four position evaluation
    
    Input: (batch_size, 1, 6, 7) - single channel board representation
    Output: (batch_size, 1) - win probability [0, 1]
    
    Architecture:
    - Conv layers to extract spatial features
    - Global average pooling
    - Dense layers for value prediction
    """
    
    def __init__(self, input_channels=1, board_height=6, board_width=7):
        super(ConnectFourCNN, self).__init__()
        
        self.input_channels = input_channels
        self.board_height = board_height
        self.board_width = board_width
        
        # Convolutional blocks
        self.conv1 = nn.Conv2d(input_channels, 64, kernel_size=3, padding=1)
        self.batch1 = nn.BatchNorm2d(64)
        
        self.conv2 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.batch2 = nn.BatchNorm2d(128)
        
        self.conv3 = nn.Conv2d(128, 128, kernel_size=3, padding=1)
        self.batch3 = nn.BatchNorm2d(128)
        
        # Global average pooling output size: 128
        
        # Dense layers
        self.fc1 = nn.Linear(128, 256)
        self.dropout1 = nn.Dropout(0.3)
        
        self.fc2 = nn.Linear(256, 128)
        self.dropout2 = nn.Dropout(0.3)
        
        self.fc3 = nn.Linear(128, 64)
        self.fc_out = nn.Linear(64, 1)
        
        # Initialize weights
        self._init_weights()
    
    def _init_weights(self):
        """Xavier initialization for weights"""
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0.0)
            elif isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                nn.init.constant_(m.bias, 0.0)
    
    def forward(self, x):
        """
        Forward pass
        
        Args:
            x: (batch_size, 1, 6, 7) board tensor
            
        Returns:
            win_prob: (batch_size, 1) sigmoid output [0, 1]
        """
        # Conv block 1
        x = self.conv1(x)
        x = self.batch1(x)
        x = F.relu(x)
        
        # Conv block 2
        x = self.conv2(x)
        x = self.batch2(x)
        x = F.relu(x)
        
        # Conv block 3
        x = self.conv3(x)
        x = self.batch3(x)
        x = F.relu(x)
        
        # Global average pooling
        x = F.adaptive_avg_pool2d(x, (1, 1))
        x = x.view(x.size(0), -1)
        
        # Dense layers
        x = self.fc1(x)
        x = F.relu(x)
        x = self.dropout1(x)
        
        x = self.fc2(x)
        x = F.relu(x)
        x = self.dropout2(x)
        
        x = self.fc3(x)
        x = F.relu(x)
        
        # Output: sigmoid for probability [0, 1]
        x = torch.sigmoid(self.fc_out(x))
        
        return x
    
    def evaluate_positions(self, boards):
        """
        Batch evaluate multiple positions
        
        Args:
            boards: (batch_size, 6, 7) numpy array or list of boards
            
        Returns:
            win_probs: (batch_size,) numpy array of win probabilities
        """
        import numpy as np
        
        if isinstance(boards, np.ndarray) and boards.ndim == 2:
            boards = boards.reshape(1, 1, 6, 7)
        elif isinstance(boards, list):
            boards = np.array(boards).reshape(len(boards), 1, 6, 7)
        else:
            boards = boards.unsqueeze(1) if boards.dim() == 3 else boards
        
        if isinstance(boards, np.ndarray):
            boards = torch.from_numpy(boards).float()
        
        with torch.no_grad():
            device = next(self.parameters()).device
            boards = boards.to(device)
            probs = self(boards)
            return probs.cpu().numpy().flatten()
